// mobile/app/(tabs)/receipts/edit-item/[receiptId]/[itemId].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import receiptService, { ReceiptItem } from '../../../../../services/receiptService';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';

export default function EditReceiptItemScreen() {
  const { receiptId, itemId } = useLocalSearchParams<{ 
    receiptId: string; 
    itemId: string; 
  }>();
  
  const [item, setItem] = useState<ReceiptItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [category, setCategory] = useState('');
  
  const [errors, setErrors] = useState<{
    productName?: string;
    quantity?: string;
    unitPrice?: string;
  }>({});

  useEffect(() => {
    if (receiptId && itemId) {
      fetchItem();
    }
  }, [receiptId, itemId]);

  const fetchItem = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const receipt = await receiptService.getReceiptById(parseInt(receiptId));
      const foundItem = receipt.items.find(i => i.id === parseInt(itemId));
      
      if (foundItem) {
        setItem(foundItem);
        setProductName(foundItem.product_name);
        setQuantity(foundItem.quantity);
        setUnitPrice(foundItem.unit_price);
        setCategory(foundItem.category || '');
      } else {
        setError('Item not found');
      }
    } catch (err: any) {
      console.error('Error fetching item:', err);
      setError(err.message || 'Failed to load item');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    const qtyNum = parseFloat(quantity);
    if (!quantity || isNaN(qtyNum) || qtyNum <= 0) {
      newErrors.quantity = 'Valid quantity required (greater than 0)';
    }

    const priceNum = parseFloat(unitPrice);
    if (!unitPrice || isNaN(priceNum) || priceNum < 0) {
      newErrors.unitPrice = 'Valid price required (0 or greater)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      
      const qtyNum = parseFloat(quantity);
      const priceNum = parseFloat(unitPrice);
      const totalPrice = qtyNum * priceNum;

      await receiptService.updateReceiptItem(
        parseInt(receiptId),
        parseInt(itemId),
        {
          product_name: productName.trim(),
          quantity: qtyNum,
          unit_price: priceNum,
          total_price: totalPrice,
          category: category.trim() || undefined,
        }
      );

      Alert.alert('Success', 'Item updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = () => {
    const qtyNum = parseFloat(quantity) || 0;
    const priceNum = parseFloat(unitPrice) || 0;
    return (qtyNum * priceNum).toFixed(2);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading item..." fullScreen />;
  }

  if (error || !item) {
    return (
      <ErrorMessage 
        message={error || 'Item not found'} 
        onRetry={fetchItem}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 p-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-text-primary">
              Edit Item
            </Text>
            <Text className="text-text-secondary mt-1">
              Update receipt item details
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <Input
              label="Product Name"
              placeholder="Enter product name"
              value={productName}
              onChangeText={(text) => {
                setProductName(text);
                setErrors((prev) => ({ ...prev, productName: undefined }));
              }}
              error={errors.productName}
              icon="pricetag-outline"
              autoFocus
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Quantity"
                  placeholder="1.0"
                  value={quantity}
                  onChangeText={(text) => {
                    setQuantity(text);
                    setErrors((prev) => ({ ...prev, quantity: undefined }));
                  }}
                  error={errors.quantity}
                  icon="layers-outline"
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="flex-1">
                <Input
                  label="Unit Price"
                  placeholder="0.00"
                  value={unitPrice}
                  onChangeText={(text) => {
                    setUnitPrice(text);
                    setErrors((prev) => ({ ...prev, unitPrice: undefined }));
                  }}
                  error={errors.unitPrice}
                  icon="cash-outline"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Input
              label="Category (Optional)"
              placeholder="e.g., Dairy, Produce, Snacks"
              value={category}
              onChangeText={setCategory}
              icon="grid-outline"
            />

            {/* Total Preview */}
            {quantity && unitPrice && (
              <View className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-text-primary font-medium">
                    Total Price
                  </Text>
                  <Text className="text-primary text-xl font-bold">
                    ${calculateTotal()}
                  </Text>
                </View>
                <Text className="text-text-secondary text-sm mt-1">
                  {quantity} × ${unitPrice}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mt-6 space-y-3">
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={isSaving}
              variant="primary"
              size="lg"
              fullWidth
            />

            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="secondary"
              size="lg"
              fullWidth
              disabled={isSaving}
            />
          </View>

          {/* Helper Text */}
          <View className="mt-6 bg-surface rounded-lg p-4">
            <Text className="text-text-secondary text-sm">
              💡 <Text className="font-semibold">Tip:</Text> The total price will be automatically calculated based on quantity and unit price.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}