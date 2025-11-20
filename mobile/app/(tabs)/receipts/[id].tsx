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
  Dimensions,
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
  const [error, setError] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      'This will re-run OCR on the receipt image. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reprocess',
          onPress: async () => {
            try {
              const updated = await receiptService.reprocessReceipt(parseInt(id));
              setReceipt(updated);
              Alert.alert('Success', 'Receipt is being reprocessed');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reprocess receipt');
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
      <ScrollView className="flex-1 p-4">
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
        </Card>

        {/* Items List */}
        <Card className="mb-4 bg-surface">
          <Text className="text-lg font-semibold text-text-primary mb-3">
            Items ({receipt.items.length})
          </Text>
          {receipt.items.length > 0 ? (
            <View>
              {receipt.items.map((item, index) => (
                <ReceiptItemComponent
                  key={item.id}
                  item={item}
                  showBorder={index < receipt.items.length - 1}
                />
              ))}
            </View>
          ) : (
            <Text className="text-text-secondary text-center py-4">
              No items found in this receipt
            </Text>
          )}
        </Card>

        {/* Processing Error */}
        {receipt.status === 'failed' && receipt.processing_error && (
          <View className="bg-error/10 border border-error/30 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <View className="flex-1 ml-2">
                <Text className="text-error font-semibold mb-1">
                  Processing Failed
                </Text>
                <Text className="text-error text-sm">
                  {receipt.processing_error}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="space-y-2 mb-4">
          {receipt.status === 'failed' && (
            <Button
              title="Reprocess Receipt"
              onPress={handleReprocess}
              variant="primary"
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