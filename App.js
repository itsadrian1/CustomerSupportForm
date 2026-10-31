
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

export default function CustomerSupportForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    "Account Problem",
    "Technical Issue",
    "Payment Concern",
    "Other",
  ];

  // Select screenshot from gallery
  const pickImage = async () => {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // Upload screenshot to Cloudinary
  const uploadImage = async () => {
    if (!image) return "";

    const cloudName =
      process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const uploadPreset =
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();

    formData.append("file", {
      uri: image.uri,
      name: image.fileName || "screenshot.jpg",
      type: image.mimeType || "image/jpeg",
    });

    formData.append("upload_preset", uploadPreset || "");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Image upload failed"
      );
    }

    return data.secure_url;
  };

  // Send support message using EmailJS
  const sendEmail = async (screenshotUrl) => {
    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id:
            process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,

          template_id:
            process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,

          user_id:
            process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,

          template_params: {
            customer_name: name,
            customer_email: email,
            issue_category: category,
            message: message,
            screenshot_url: screenshotUrl || "No screenshot uploaded",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Email sending failed");
    }
  };

  // Submit support form
  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() ||
        !category || !message.trim()) {
      Alert.alert("Error", "Please complete all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const screenshotUrl = await uploadImage();

      await sendEmail(screenshotUrl);

      Alert.alert(
        "Success",
        "Your support request has been sent!"
      );

      setName("");
      setEmail("");
      setCategory("");
      setMessage("");
      setImage(null);

    } catch (error) {
      Alert.alert(
        "Submission Failed",
        error.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Customer Support</Text>

      <Text style={styles.subtitle}>
        Tell us about your problem. We're here to help.
      </Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Issue Category</Text>

      <View style={styles.categories}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.categoryButton,
              category === item && styles.selectedCategory,
            ]}
            onPress={() => setCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                category === item && styles.selectedText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Describe your problem here..."
        multiline
        textAlignVertical="top"
        value={message}
        onChangeText={setMessage}
      />

      <Text style={styles.label}>Screenshot Upload</Text>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={pickImage}
      >
        <Text style={styles.uploadText}>
          + Select Screenshot
        </Text>
      </TouchableOpacity>

      {image && (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: image.uri }}
            style={styles.preview}
            resizeMode="contain"
          />

          <TouchableOpacity onPress={() => setImage(null)}>
            <Text style={styles.removeText}>
              Remove Screenshot
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            Submit Support Request
          </Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6fa",
  },
  content: {
    padding: 22,
    paddingTop: 55,
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#172554",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    marginBottom: 25,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 15,
    color: "#1e293b",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe2ea",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  messageInput: {
    height: 120,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: "#fff",
  },
  selectedCategory: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  categoryText: {
    color: "#334155",
    fontSize: 12,
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
  uploadButton: {
    backgroundColor: "#e0eaff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  uploadText: {
    color: "#1d4ed8",
    fontWeight: "bold",
  },
  previewContainer: {
    marginTop: 15,
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  removeText: {
    color: "#dc2626",
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: "#2563eb",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
