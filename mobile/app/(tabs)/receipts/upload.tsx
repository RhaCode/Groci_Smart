// mobile/app/(tabs)/receipts/upload.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Card } from "../../../components/ui/Card";
import receiptService from "../../../services/receiptService";

export default function UploadReceiptScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  // Request media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Media library permission is required to select photos",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  // Take photo with camera
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Show image source options
  const showImageOptions = () => {
    Alert.alert(
      "Upload Receipt",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: takePhoto,
        },
        {
          text: "Choose from Gallery",
          onPress: pickImage,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  // Remove selected image
  const removeImage = () => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setImageUri(null),
      },
    ]);
  };

  // Upload receipt
  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert("Error", "Please select a receipt image");
      return;
    }

    try {
      setIsUploading(true);

      // Prepare image data
      const filename = imageUri.split("/").pop() || "receipt.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      const uploadData = {
        receipt_image: {
          uri: imageUri,
          type,
          name: filename,
        },
        store_name: storeName,
        store_location: storeLocation,
        purchase_date: purchaseDate || undefined,
      };

      await receiptService.uploadReceipt(uploadData);

      Alert.alert(
        "Success",
        "Receipt uploaded successfully! Processing will begin shortly.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Failed",
        error.message || "Failed to upload receipt. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-10 bg-background">
      {/* Image Preview Section */}
      <Card className="mb-4 bg-surface">
        <Text className="text-lg font-semibold text-text-primary mb-3">
          Receipt Image
        </Text>

        {imageUri ? (
          <View>
            <Image
              source={{ uri: imageUri }}
              className="w-full h-96 rounded-lg bg-surface-light"
              resizeMode="contain"
            />
            <View className="flex-row justify-between mt-3">
              <Button
                title="Change Image"
                onPress={showImageOptions}
                variant="outline"
                size="sm"
                className="flex-1 mr-2"
              />
              <Button
                title="Remove"
                onPress={removeImage}
                variant="danger"
                size="sm"
                className="flex-1 ml-2"
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={showImageOptions}
            className="border-2 border-dashed border-border-light rounded-lg p-8 items-center justify-center bg-surface-light"
          >
            <View className="bg-primary/20 rounded-full p-4 mb-3">
              <Ionicons name="camera-outline" size={48} color="#0ea5e9" />
            </View>
            <Text className="text-text-primary font-semibold text-center mb-1">
              Add Receipt Image
            </Text>
            <Text className="text-text-secondary text-sm text-center">
              Take a photo or choose from gallery
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Optional Information Section */}
      <Card className="mb-4 bg-surface">
        <Text className="text-lg font-semibold text-text-primary mb-3">
          Receipt Details (Optional)
        </Text>
        <Text className="text-text-secondary text-sm mb-4">
          These details will be auto-extracted from the image, but you can
          provide them manually if needed.
        </Text>

        <Input
          label="Store Name"
          placeholder="e.g., Walmart, Target"
          value={storeName}
          onChangeText={setStoreName}
          icon="storefront-outline"
        />

        <Input
          label="Store Location"
          placeholder="e.g., Downtown Mall"
          value={storeLocation}
          onChangeText={setStoreLocation}
          icon="location-outline"
        />

        <Input
          label="Purchase Date"
          placeholder="YYYY-MM-DD"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          icon="calendar-outline"
          keyboardType="default"
        />
      </Card>

      {/* Upload Button */}
      <Button
        title="Upload Receipt"
        onPress={handleUpload}
        loading={isUploading}
        disabled={!imageUri}
        fullWidth
        size="lg"
        variant="primary"
      />

      {/* Cancel Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="py-3 items-center my-10"
        disabled={isUploading}
      >
        <Text className="text-text-secondary font-medium">Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}