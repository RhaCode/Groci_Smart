// mobile/app/(tabs)/profile/stores.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService, { PreferredStore } from '../../../services/authService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export default function StoresScreen() {
  const [preferredStores, setPreferredStores] = useState<PreferredStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddStore, setShowAddStore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableStores, setAvailableStores] = useState([
    { id: 1, name: 'Whole Foods Market', location: 'Downtown' },
    { id: 2, name: 'Trader Joe\'s', location: 'Midtown' },
    { id: 3, name: 'Sprouts Farmers Market', location: 'East Side' },
    { id: 4, name: 'The Fresh Market', location: 'West End' },
    { id: 5, name: 'Kroger', location: 'Central' },
  ]);

  useEffect(() => {
    fetchPreferredStores();
  }, []);

  const fetchPreferredStores = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const stores = await authService.getPreferredStores();
      setPreferredStores(stores);
    } catch (err: any) {
      setError(err.message || 'Failed to load preferred stores');
      console.error('Error fetching stores:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAddStore = async (store: any) => {
    try {
      setIsAddingStore(true);
      const newStore = await authService.addPreferredStore(store.id);
      setPreferredStores([...preferredStores, newStore]);
      setShowAddStore(false);
      Alert.alert('Success', `${store.name} added to preferred stores`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add store');
    } finally {
      setIsAddingStore(false);
    }
  };

  const handleRemoveStore = (storeId: number, storeName: string) => {
    Alert.alert(
      'Remove Store',
      `Remove "${storeName}" from preferred stores?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.removePreferredStore(storeId);
              setPreferredStores((prev) =>
                prev.filter((store) => store.id !== storeId)
              );
              Alert.alert('Success', 'Store removed from preferred stores');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove store');
            }
          },
        },
      ]
    );
  };

  const getAvailableStoresToAdd = () => {
    const preferredStoreIds = preferredStores.map((s) => s.store_id);
    return availableStores
      .filter(
        (store) =>
          !preferredStoreIds.includes(store.id) &&
          store.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading preferred stores..." fullScreen />;
  }

  if (error && preferredStores.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => fetchPreferredStores()}
      />
    );
  }

  const availableToAdd = getAvailableStoresToAdd();

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => fetchPreferredStores(true)}
          colors={['#e879f9']}
          tintColor="#e879f9"
        />
      }
    >
      <View className="p-4">
        {/* Current Preferred Stores */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-text-primary">
              Your Preferred Stores
            </Text>
            <Text className="text-sm text-text-secondary">
              {preferredStores.length}
            </Text>
          </View>

          {preferredStores.length > 0 ? (
            <Card className="bg-surface">
              {preferredStores.map((store, index) => (
                <View
                  key={store.id}
                  className={`flex-row justify-between items-center py-4 px-4 ${
                    index !== preferredStores.length - 1
                      ? 'border-b border-border'
                      : ''
                  }`}
                >
                  <View className="flex-1">
                    <Text className="text-base font-medium text-text-primary">
                      {store.store_name}
                    </Text>
                    <Text className="text-sm text-text-secondary mt-1">
                      {store.store_location}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      handleRemoveStore(store.store_id, store.store_name)
                    }
                    className="ml-3 p-2"
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          ) : (
            <Card className="items-center py-8 bg-surface">
              <View className="bg-accent-light/20 rounded-full p-6 mb-4">
                <Ionicons
                  name="storefront-outline"
                  size={48}
                  color="#e879f9"
                />
              </View>
              <Text className="text-base font-semibold text-text-primary mb-2">
                No Preferred Stores
              </Text>
              <Text className="text-sm text-text-secondary text-center">
                Add stores to see personalized prices and information
              </Text>
            </Card>
          )}
        </View>

        {/* Add Store Section */}
        <View>
          <Text className="text-lg font-bold text-text-primary mb-3">
            Add Store
          </Text>

          {!showAddStore ? (
            <Button
              title="Add Preferred Store"
              onPress={() => setShowAddStore(true)}
              variant="secondary"
              fullWidth
            />
          ) : (
            <Card className="bg-surface">
              <View className="p-4">
                {/* Search Input */}
                <View className="mb-4">
                  <View className="flex-row items-center border border-border rounded-lg bg-background px-3">
                    <Ionicons
                      name="search"
                      size={20}
                      color="#9ca3af"
                    />
                    <TextInput
                      className="flex-1 ml-2 py-2 text-text-primary"
                      placeholder="Search stores..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor="#6b7280"
                    />
                  </View>
                </View>

                {/* Available Stores List */}
                {availableToAdd.length > 0 ? (
                  <View className="mb-4">
                    {availableToAdd.map((store, index) => (
                      <View
                        key={store.id}
                        className={`flex-row justify-between items-center py-3 ${
                          index !== availableToAdd.length - 1
                            ? 'border-b border-border'
                            : ''
                        }`}
                      >
                        <View className="flex-1">
                          <Text className="text-base font-medium text-text-primary">
                            {store.name}
                          </Text>
                          <Text className="text-sm text-text-secondary mt-1">
                            {store.location}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleAddStore(store)}
                          disabled={isAddingStore}
                          className="ml-3 bg-accent rounded-lg p-2"
                        >
                          {isAddingStore ? (
                            <ActivityIndicator
                              size="small"
                              color="#f9fafb"
                            />
                          ) : (
                            <Ionicons
                              name="add"
                              size={20}
                              color="#f9fafb"
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="py-6 items-center">
                    <Text className="text-sm text-text-secondary">
                      {searchQuery
                        ? 'No stores match your search'
                        : 'All available stores added'}
                    </Text>
                  </View>
                )}

                {/* Close Button */}
                <Button
                  title="Close"
                  onPress={() => {
                    setShowAddStore(false);
                    setSearchQuery('');
                  }}
                  variant="outline"
                  fullWidth
                />
              </View>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}