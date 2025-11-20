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
import { useTheme } from '../../../../../context/ThemeContext';

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

  const { theme } = useTheme();

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* Form */}
          <View style={{ gap: 16 }}>
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

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
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

              <View style={{ flex: 1 }}>
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
              <View style={{ 
                backgroundColor: `${theme.colors.primary}10`, 
                borderWidth: 1, 
                borderColor: `${theme.colors.primary}30`, 
                borderRadius: 8, 
                padding: 16 
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ 
                    color: theme.colors['text-primary'], 
                    fontWeight: '500' 
                  }}>
                    Total Price
                  </Text>
                  <Text style={{ 
                    color: theme.colors.primary, 
                    fontSize: 20, 
                    fontWeight: 'bold' 
                  }}>
                    ${calculateTotal()}
                  </Text>
                </View>
                <Text style={{ 
                  color: theme.colors['text-secondary'], 
                  fontSize: 14, 
                  marginTop: 4 
                }}>
                  {quantity} × ${unitPrice}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={{ marginTop: 24, gap: 12 }}>
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
          <View style={{ 
            marginTop: 24, 
            backgroundColor: theme.colors.surface, 
            borderRadius: 8, 
            padding: 16 
          }}>
            <Text style={{ 
              color: theme.colors['text-secondary'], 
              fontSize: 14 
            }}>
              💡 <Text style={{ fontWeight: '600' }}>Tip:</Text> The total price will be automatically calculated based on quantity and unit price.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}