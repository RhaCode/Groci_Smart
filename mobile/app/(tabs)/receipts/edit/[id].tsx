// mobile/app/(tabs)/receipts/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import receiptService, { Receipt, ReceiptItem } from '../../../../services/receiptService';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../components/ui/ErrorMessage';

export default function EditReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const fetchReceipt = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await receiptService.getReceiptById(parseInt(id));
      setReceipt(data);
      
      // Populate form
      setStoreName(data.store_name);
      setStoreLocation(data.store_location);
      setPurchaseDate(data.purchase_date || '');
      setTaxAmount(data.tax_amount || '');
      setItems(data.items);
    } catch (err: any) {
      console.error('Error fetching receipt:', err);
      setError(err.message || 'Failed to load receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReceipt = async () => {
    try {
      setIsSaving(true);

      // Update receipt info
      await receiptService.updateReceipt(parseInt(id), {
        store_name: storeName,
        store_location: storeLocation,
        purchase_date: purchaseDate || undefined,
        tax_amount: taxAmount || undefined,
      });

      Alert.alert('Success', 'Receipt updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update receipt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = async (itemId: number, field: string, value: string) => {
    try {
      const updateData: any = { [field]: value };
      
      // If updating quantity or unit_price, recalculate total
      const item = items.find((i) => i.id === itemId);
      if (item) {
        if (field === 'quantity' || field === 'unit_price') {
          const qty = field === 'quantity' ? parseFloat(value) : parseFloat(item.quantity);
          const price = field === 'unit_price' ? parseFloat(value) : parseFloat(item.unit_price);
          updateData.total_price = (qty * price).toFixed(2);
        }
      }

      await receiptService.updateReceiptItem(parseInt(id), itemId, updateData);
      
      // Update local state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, ...updateData } : item
        )
      );
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDeleteItem = (itemId: number) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await receiptService.deleteReceiptItem(parseInt(id), itemId);
              setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
              Alert.alert('Success', 'Item deleted');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleAddItem = () => {
    // router.push({
    //   pathname: '/(tabs)/receipts/add-item/[id]',
    //   params: { id },
    // });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading receipt..." fullScreen />;
  }

  if (error || !receipt) {
    return <ErrorMessage message={error || 'Receipt not found'} onRetry={fetchReceipt} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4">
          {/* Receipt Information */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Receipt Information
            </Text>

            <Input
              label="Store Name"
              placeholder="Enter store name"
              value={storeName}
              onChangeText={setStoreName}
              icon="storefront-outline"
            />

            <Input
              label="Store Location"
              placeholder="Enter store location"
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
            />

            <Input
              label="Tax Amount"
              placeholder="0.00"
              value={taxAmount}
              onChangeText={setTaxAmount}
              icon="cash-outline"
              keyboardType="decimal-pad"
            />
          </Card>

          {/* Items Section */}
          <Card className="mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-800">
                Items ({items.length})
              </Text>
              <TouchableOpacity
                onPress={handleAddItem}
                className="bg-primary-600 rounded-full p-2"
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <EditableReceiptItem
                key={item.id}
                item={item}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                showBorder={index < items.length - 1}
              />
            ))}

            {items.length === 0 && (
              <Text className="text-gray-600 text-center py-4">
                No items yet. Tap + to add items.
              </Text>
            )}
          </Card>

          {/* Save Button */}
          <Button
            title="Save Changes"
            onPress={handleSaveReceipt}
            loading={isSaving}
            fullWidth
            size="lg"
          />

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="py-3 items-center mt-3"
            disabled={isSaving}
          >
            <Text className="text-gray-600 font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Editable Receipt Item Component
interface EditableReceiptItemProps {
  item: ReceiptItem;
  onUpdate: (itemId: number, field: string, value: string) => void;
  onDelete: (itemId: number) => void;
  showBorder?: boolean;
}

const EditableReceiptItem: React.FC<EditableReceiptItemProps> = ({
  item,
  onUpdate,
  onDelete,
  showBorder = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [productName, setProductName] = useState(item.product_name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unitPrice, setUnitPrice] = useState(item.unit_price);

  const handleSave = () => {
    if (productName !== item.product_name) {
      onUpdate(item.id, 'product_name', productName);
    }
    if (quantity !== item.quantity) {
      onUpdate(item.id, 'quantity', quantity);
    }
    if (unitPrice !== item.unit_price) {
      onUpdate(item.id, 'unit_price', unitPrice);
    }
    setIsEditing(false);
  };

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (isEditing) {
    return (
      <View className={`py-3 ${showBorder ? 'border-b border-gray-200' : ''}`}>
        <Input
          placeholder="Product name"
          value={productName}
          onChangeText={setProductName}
          containerClassName="mb-2"
        />
        <View className="flex-row gap-2 mb-2">
          <View className="flex-1">
            <Input
              placeholder="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Input
              placeholder="Unit Price"
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View className="flex-row gap-2">
          <Button title="Save" onPress={handleSave} size="sm" className="flex-1" />
          <Button
            title="Cancel"
            onPress={() => setIsEditing(false)}
            variant="outline"
            size="sm"
            className="flex-1"
          />
        </View>
      </View>
    );
  }

  return (
    <View className={`py-3 ${showBorder ? 'border-b border-gray-200' : ''}`}>
      <View className="flex-row justify-between items-start mb-2">
        <Text className="flex-1 text-gray-800 font-medium">{item.product_name}</Text>
        <Text className="text-gray-800 font-semibold ml-2">
          {formatAmount(item.total_price)}
        </Text>
      </View>
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-gray-600">
          Qty: {parseFloat(item.quantity)} × {formatAmount(item.unit_price)}
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={20} color="#0284c7" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)}>
            <Ionicons name="trash" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};