// mobile/app/(tabs)/receipts/add-item/[id].tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import receiptService from "../../../../services/receiptService";
import productService, {
  ProductSummary,
} from "../../../../services/productService";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { LoadingSpinner } from "../../../../components/ui/LoadingSpinner";
import { useTheme } from "../../../../context/ThemeContext";

export default function AddReceiptItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);
  const { theme } = useTheme();

  // Form state
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [category, setCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(
    null
  );

  // Product search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Search for products
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await productService.searchProducts({ query });
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select product from search results
  const handleSelectProduct = (product: ProductSummary) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setSearchQuery(product.name);
    setShowSearchResults(false);

    // Pre-fill unit price if available
    if (product.lowest_price) {
      setUnitPrice(product.lowest_price.toString());
    }
  };

  // Clear product selection
  const handleClearProduct = () => {
    setSelectedProduct(null);
    setProductName("");
    setSearchQuery("");
    setUnitPrice("");
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!productName.trim()) {
      newErrors.productName = "Product name is required";
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (!unitPrice || parseFloat(unitPrice) < 0) {
      newErrors.unitPrice = "Valid unit price is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate total price
  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return (qty * price).toFixed(2);
  };

  // Add item to receipt
  const handleAddItem = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const itemData = {
        product_name: productName,
        quantity: parseFloat(quantity),
        unit_price: parseFloat(unitPrice),
        total_price: parseFloat(calculateTotal()),
        category: category || undefined,
        product: selectedProduct?.id || undefined,
      };

      await receiptService.addReceiptItem(parseInt(id), itemData);

      Alert.alert("Success", "Item added to receipt", [
        {
          text: "Add Another",
          onPress: () => {
            // Reset form
            setProductName("");
            setQuantity("1");
            setUnitPrice("");
            setCategory("");
            setSelectedProduct(null);
            setSearchQuery("");
          },
        },
        {
          text: "Done",
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add item");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product Search */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.colors["text-primary"],
              marginBottom: 12,
            }}
          >
            Search Product
          </Text>
          <Text
            style={{
              color: theme.colors["text-secondary"],
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            Search for existing products or enter manually
          </Text>

          <View style={{ position: "relative" }}>
            <Input
              placeholder="Search for product..."
              value={searchQuery}
              onChangeText={handleSearch}
              icon="search-outline"
              containerStyle={{ marginBottom: 0 }}
            />
            {isSearching && (
              <View style={{ position: "absolute", right: 12, top: 12 }}>
                <LoadingSpinner size="small" />
              </View>
            )}
          </View>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <View
              style={{
                marginTop: 8,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                backgroundColor: theme.colors.surface,
              }}
            >
              {searchResults.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => handleSelectProduct(product)}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors["text-primary"],
                      fontWeight: "500",
                    }}
                  >
                    {product.name}
                  </Text>
                  {product.brand && (
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors["text-secondary"],
                      }}
                    >
                      {product.brand}
                    </Text>
                  )}
                  {product.lowest_price && (
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.primary,
                      }}
                    >
                      Lowest: ${product.lowest_price.toFixed(2)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Selected Product */}
          {selectedProduct && (
            <View
              style={{
                marginTop: 12,
                backgroundColor: `${theme.colors.primary}20`,
                borderWidth: 1,
                borderColor: `${theme.colors.primary}50`,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={{
                        color: theme.colors.primary,
                        fontWeight: "600",
                        marginLeft: 8,
                      }}
                    >
                      Product Selected
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: theme.colors["text-primary"],
                      fontWeight: "500",
                    }}
                  >
                    {selectedProduct.name}
                  </Text>
                  {selectedProduct.brand && (
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors["text-secondary"],
                      }}
                    >
                      {selectedProduct.brand}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleClearProduct}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        {/* Item Details */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.colors["text-primary"],
              marginBottom: 12,
            }}
          >
            Item Details
          </Text>

          <Input
            label="Product Name *"
            placeholder="Enter product name"
            value={productName}
            onChangeText={(value) => {
              setProductName(value);
              setErrors((prev) => ({ ...prev, productName: "" }));
            }}
            error={errors.productName}
            icon="pricetag-outline"
          />

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Quantity *"
                placeholder="1"
                value={quantity}
                onChangeText={(value) => {
                  setQuantity(value);
                  setErrors((prev) => ({ ...prev, quantity: "" }));
                }}
                error={errors.quantity}
                icon="calculator-outline"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Unit Price *"
                placeholder="0.00"
                value={unitPrice}
                onChangeText={(value) => {
                  setUnitPrice(value);
                  setErrors((prev) => ({ ...prev, unitPrice: "" }));
                }}
                error={errors.unitPrice}
                icon="cash-outline"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Input
            label="Category (Optional)"
            placeholder="e.g., Dairy, Produce"
            value={category}
            onChangeText={setCategory}
            icon="list-outline"
          />

          {/* Total Preview */}
          {quantity && unitPrice && (
            <View
              style={{
                backgroundColor: theme.colors["surface-light"],
                borderRadius: 8,
                padding: 12,
                marginTop: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: theme.colors["text-secondary"] }}>
                  Total Price:
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: theme.colors.primary,
                  }}
                >
                  ${calculateTotal()}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors["text-muted"],
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                {quantity} × ${unitPrice} = ${calculateTotal()}
              </Text>
            </View>
          )}
        </Card>

        {/* Info Note */}
        <View
          style={{
            backgroundColor: `${theme.colors.primary}20`,
            borderWidth: 1,
            borderColor: `${theme.colors.primary}50`,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Ionicons
              name="information-circle"
              size={20}
              color={theme.colors.primary}
            />
            <Text
              style={{
                flex: 1,
                color: theme.colors.primary,
                fontSize: 14,
                marginLeft: 8,
              }}
            >
              Link this item to an existing product to enable price tracking and
              comparisons.
            </Text>
          </View>
        </View>

        {/* Add Button */}
        <Button
          title="Add Item"
          onPress={handleAddItem}
          loading={isSaving}
          fullWidth
          size="lg"
        />

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingVertical: 12, alignItems: "center", marginTop: 12 }}
          disabled={isSaving}
        >
          <Text
            style={{
              color: theme.colors["text-secondary"],
              fontWeight: "500",
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
