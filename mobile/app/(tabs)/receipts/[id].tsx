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
import { useTheme } from '../../../context/ThemeContext';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const { theme } = useTheme();

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView 
        style={{ flex: 1, padding: 16 }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Receipt Image */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setImageModalVisible(true)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: receipt.receipt_image_url }}
              style={{ width: '100%', height: 320, borderRadius: 8, backgroundColor: theme.colors['surface-light'] }}
              resizeMode="contain"
            />
            <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9999, padding: 8 }}>
              <Ionicons name="expand-outline" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </Card>

        {/* Receipt Info */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors['text-primary'], marginBottom: 4 }}>
                {receipt.store_name || 'Unknown Store'}
              </Text>
              {receipt.store_location && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={16} color={theme.colors['text-muted']} />
                  <Text style={{ color: theme.colors['text-secondary'], marginLeft: 4 }}>{receipt.store_location}</Text>
                </View>
              )}
            </View>
            <ReceiptStatusBadge status={receipt.status} size="md" />
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: theme.colors['text-secondary'] }}>Date</Text>
              <Text style={{ color: theme.colors['text-primary'], fontWeight: '500' }}>
                {formatDate(receipt.purchase_date)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: theme.colors['text-secondary'] }}>Items</Text>
              <Text style={{ color: theme.colors['text-primary'], fontWeight: '500' }}>{receipt.items_count}</Text>
            </View>
            {receipt.tax_amount && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.colors['text-secondary'] }}>Tax</Text>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '500' }}>
                  {formatAmount(receipt.tax_amount)}
                </Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors['text-primary'] }}>Total</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>
                {formatAmount(receipt.total_amount)}
              </Text>
            </View>
          </View>

          {/* Edit Receipt Button */}
          <TouchableOpacity
            onPress={handleEditReceipt}
            style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontWeight: '500', marginLeft: 8 }}>Edit Receipt Details</Text>
          </TouchableOpacity>
        </Card>

        {/* Processing Status Messages */}
        {receipt.status === 'processing' && (
          <View style={{ backgroundColor: `${theme.colors.primary}20`, borderWidth: 1, borderColor: `${theme.colors.primary}50`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <LoadingSpinner size="small" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: theme.colors.primary, fontWeight: '600', marginBottom: 4 }}>
                  Processing Receipt
                </Text>
                <Text style={{ color: theme.colors.primary, fontSize: 14 }}>
                  OCR is extracting text from your receipt. This may take a few moments.
                </Text>
              </View>
            </View>
          </View>
        )}

        {receipt.status === 'failed' && receipt.processing_error && (
          <View style={{ backgroundColor: `${theme.colors.error}20`, borderWidth: 1, borderColor: `${theme.colors.error}50`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: theme.colors.error, fontWeight: '600', marginBottom: 4 }}>
                  Processing Failed
                </Text>
                <Text style={{ color: theme.colors.error, fontSize: 14, marginBottom: 8 }}>
                  {receipt.processing_error}
                </Text>
                <TouchableOpacity
                  onPress={handleReprocess}
                  disabled={isReprocessing}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Text style={{ color: theme.colors.error, fontWeight: '600', textDecorationLine: 'underline' }}>
                    {isReprocessing ? 'Reprocessing...' : 'Try Again'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Items List */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors['text-primary'] }}>
              Items ({receipt.items.length})
            </Text>
            <TouchableOpacity
              onPress={handleAddItem}
              style={{ backgroundColor: `${theme.colors.primary}20`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: '500', marginLeft: 4 }}>Add Item</Text>
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
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 12 }}>
                    <TouchableOpacity
                      onPress={() => handleEditItem(item.id)}
                      style={{ flex: 1, backgroundColor: theme.colors['surface-light'], borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="create-outline" size={16} color={theme.colors['text-secondary']} />
                      <Text style={{ color: theme.colors['text-secondary'], marginLeft: 4, fontSize: 14, fontWeight: '500' }}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id, item.product_name)}
                      style={{ flex: 1, backgroundColor: `${theme.colors.error}20`, borderWidth: 1, borderColor: `${theme.colors.error}50`, borderRadius: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                      <Text style={{ color: theme.colors.error, marginLeft: 4, fontSize: 14, fontWeight: '500' }}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {index < receipt.items.length - 1 && (
                    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border, marginBottom: 12 }} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={48} color={theme.colors['text-muted']} />
              <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center', marginTop: 8 }}>
                No items found in this receipt
              </Text>
              <TouchableOpacity
                onPress={handleAddItem}
                style={{ marginTop: 16, backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '500' }}>Add First Item</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 8, marginBottom: 16 }}>
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
          <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors['text-primary'], marginBottom: 8 }}>
              Extracted Text (OCR)
            </Text>
            <ScrollView 
              style={{ backgroundColor: theme.colors['surface-light'], padding: 12, borderRadius: 8, maxHeight: 160 }}
              nestedScrollEnabled
            >
              <Text style={{ color: theme.colors['text-secondary'], fontSize: 12, fontFamily: 'monospace' }}>
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
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => setImageModalVisible(false)}
              style={{ position: 'absolute', top: 48, right: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9999, padding: 8 }}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Image
              source={{ uri: receipt.receipt_image_url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}