// mobile/app/(tabs)/receipts/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import receiptService, { Receipt } from '../../../services/receiptService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { ReceiptItemComponent } from '../../../components/receipts/ReceiptItem';
import { ReceiptStatusBadge } from '../../../components/receipts/ReceiptStatusBadge';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

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
    } catch (err: any) {
      console.error('Error fetching receipt:', err);
      setError(err.message || 'Failed to load receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReceipt();
    setIsRefreshing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await receiptService.deleteReceipt(parseInt(id));
      Alert.alert('Success', 'Receipt deleted successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete receipt');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReprocess = async () => {
    Alert.alert(
      'Reprocess Receipt',
      'This will re-run OCR on the receipt image and may update extracted data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reprocess',
          onPress: async () => {
            try {
              setIsReprocessing(true);
              const updated = await receiptService.reprocessReceipt(parseInt(id));
              setReceipt(updated);
              Alert.alert('Success', 'Receipt is being reprocessed. Pull down to refresh and see updates.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reprocess receipt');
            } finally {
              setIsReprocessing(false);
            }
          },
        },
      ]
    );
  };

  const handleEditReceipt = () => {
    router.push(`/(tabs)/receipts/edit/${id}`);
  };

  const handleAddItem = () => {
    router.push(`/(tabs)/receipts/add-item/${id}`);
  };

  const handleEditItem = (itemId: number) => {
    // Navigate to edit item screen with both receipt id and item id
    router.push({
      pathname: '/(tabs)/receipts/edit-item/[receiptId]/[itemId]',
      params: { receiptId: id, itemId: itemId.toString() },
    });
  };

  const handleDeleteItem = (itemId: number, itemName: string) => {
    Alert.alert(
      'Delete Item',
      `Remove "${itemName}" from this receipt?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await receiptService.deleteReceiptItem(parseInt(id), itemId);
              // Refresh receipt data
              await fetchReceipt();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading receipt..." fullScreen />;
  }

  if (error || !receipt) {
    return <ErrorMessage message={error || 'Receipt not found'} onRetry={fetchReceipt} />;
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Receipt Image */}
        <Card className="mb-4 bg-surface">
          <TouchableOpacity
            onPress={() => setImageModalVisible(true)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: receipt.receipt_image_url }}
              className="w-full h-80 rounded-lg bg-surface-light"
              resizeMode="contain"
            />
            <View className="absolute bottom-2 right-2 bg-black/50 rounded-full p-2">
              <Ionicons name="expand-outline" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </Card>

        {/* Receipt Info */}
        <Card className="mb-4 bg-surface">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-text-primary mb-1">
                {receipt.store_name || 'Unknown Store'}
              </Text>
              {receipt.store_location && (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={16} color="#9ca3af" />
                  <Text className="text-text-secondary ml-1">{receipt.store_location}</Text>
                </View>
              )}
            </View>
            <ReceiptStatusBadge status={receipt.status} size="md" />
          </View>

          <View className="border-t border-border pt-3">
            <View className="flex-row justify-between mb-2">
              <Text className="text-text-secondary">Date</Text>
              <Text className="text-text-primary font-medium">
                {formatDate(receipt.purchase_date)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-text-secondary">Items</Text>
              <Text className="text-text-primary font-medium">{receipt.items_count}</Text>
            </View>
            {receipt.tax_amount && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-text-secondary">Tax</Text>
                <Text className="text-text-primary font-medium">
                  {formatAmount(receipt.tax_amount)}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between pt-2 border-t border-border">
              <Text className="text-lg font-semibold text-text-primary">Total</Text>
              <Text className="text-lg font-bold text-primary">
                {formatAmount(receipt.total_amount)}
              </Text>
            </View>
          </View>

          {/* Edit Receipt Button */}
          <TouchableOpacity
            onPress={handleEditReceipt}
            className="mt-3 pt-3 border-t border-border flex-row items-center justify-center"
          >
            <Ionicons name="create-outline" size={20} color="#0ea5e9" />
            <Text className="text-primary font-medium ml-2">Edit Receipt Details</Text>
          </TouchableOpacity>
        </Card>

        {/* Processing Status Messages */}
        {receipt.status === 'processing' && (
          <View className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <LoadingSpinner size="small" />
              <View className="flex-1 ml-2">
                <Text className="text-primary font-semibold mb-1">
                  Processing Receipt
                </Text>
                <Text className="text-primary text-sm">
                  OCR is extracting text from your receipt. This may take a few moments.
                </Text>
              </View>
            </View>
          </View>
        )}

        {receipt.status === 'failed' && receipt.processing_error && (
          <View className="bg-error/10 border border-error/30 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <View className="flex-1 ml-2">
                <Text className="text-error font-semibold mb-1">
                  Processing Failed
                </Text>
                <Text className="text-error text-sm mb-2">
                  {receipt.processing_error}
                </Text>
                <TouchableOpacity
                  onPress={handleReprocess}
                  disabled={isReprocessing}
                  className="self-start"
                >
                  <Text className="text-error font-semibold underline">
                    {isReprocessing ? 'Reprocessing...' : 'Try Again'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Items List */}
        <Card className="mb-4 bg-surface">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-text-primary">
              Items ({receipt.items.length})
            </Text>
            <TouchableOpacity
              onPress={handleAddItem}
              className="bg-primary/10 px-3 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="add-circle-outline" size={18} color="#0ea5e9" />
              <Text className="text-primary font-medium ml-1">Add Item</Text>
            </TouchableOpacity>
          </View>

          {receipt.items.length > 0 ? (
            <View>
              {receipt.items.map((item, index) => (
                <View key={item.id}>
                  <ReceiptItemComponent
                    item={item}
                    showBorder={false}
                  />
                  {/* Item Actions */}
                  <View className="flex-row gap-2 mt-2 mb-3">
                    <TouchableOpacity
                      onPress={() => handleEditItem(item.id)}
                      className="flex-1 bg-surface-light border border-border rounded-lg py-2 flex-row items-center justify-center"
                    >
                      <Ionicons name="create-outline" size={16} color="#64748b" />
                      <Text className="text-text-secondary ml-1 text-sm font-medium">
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id, item.product_name)}
                      className="flex-1 bg-error/10 border border-error/30 rounded-lg py-2 flex-row items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text className="text-error ml-1 text-sm font-medium">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {index < receipt.items.length - 1 && (
                    <View className="border-b border-border mb-3" />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="py-8 items-center">
              <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
              <Text className="text-text-secondary text-center mt-2">
                No items found in this receipt
              </Text>
              <TouchableOpacity
                onPress={handleAddItem}
                className="mt-4 bg-primary px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Add First Item</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <View className="space-y-2 mb-4">
          {(receipt.status === 'failed' || receipt.status === 'completed') && (
            <Button
              title="Reprocess Receipt"
              onPress={handleReprocess}
              loading={isReprocessing}
              variant="secondary"
              fullWidth
            />
          )}
          
          <Button
            title="Delete Receipt"
            onPress={handleDelete}
            loading={isDeleting}
            variant="danger"
            fullWidth
          />
        </View>

        {/* OCR Text (Collapsible - Optional) */}
        {receipt.ocr_text && (
          <Card className="mb-4 bg-surface">
            <Text className="text-lg font-semibold text-text-primary mb-2">
              Extracted Text (OCR)
            </Text>
            <ScrollView 
              className="bg-surface-light p-3 rounded-lg max-h-40"
              nestedScrollEnabled
            >
              <Text className="text-text-secondary text-xs font-mono">
                {receipt.ocr_text}
              </Text>
            </ScrollView>
          </Card>
        )}
      </ScrollView>

      {/* Full Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View className="flex-1 bg-black">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => setImageModalVisible(false)}
              className="absolute top-12 right-4 z-10 bg-black/50 rounded-full p-2"
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Image
              source={{ uri: receipt.receipt_image_url }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}