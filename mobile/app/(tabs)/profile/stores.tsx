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
import productService, { Store } from '../../../services/productService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useTheme } from '../../../context/ThemeContext';

export default function StoresScreen() {
  const [preferredStores, setPreferredStores] = useState<PreferredStore[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddStore, setShowAddStore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Fetch both preferred stores and all available stores
      const [preferred, stores] = await Promise.all([
        authService.getPreferredStores(),
        productService.getStores(),
      ]);
      
      setPreferredStores(preferred);
      setAllStores(stores);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load stores';
      setError(errorMessage);
      console.error('Error fetching stores:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAddStore = async (store: Store) => {
    try {
      setIsAddingStore(true);
      const newPreferredStore = await authService.addPreferredStore(store.id);
      setPreferredStores([...preferredStores, newPreferredStore]);
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
                prev.filter((store) => store.store_id !== storeId)
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
    return allStores
      .filter(
        (store) =>
          !preferredStoreIds.includes(store.id) &&
          store.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 10);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading preferred stores..." fullScreen />;
  }

  if (error && preferredStores.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => loadInitialData()}
      />
    );
  }

  const availableToAdd = getAvailableStoresToAdd();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadInitialData(true)}
            colors={[theme.colors.accent]}
            tintColor={theme.colors.accent}
          />
        }
      >
        <View style={{ padding: 16 }}>
          {/* Current Preferred Stores */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: theme.colors['text-primary'] 
              }}>
                Your Preferred Stores
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: theme.colors['text-secondary'] 
              }}>
                {preferredStores.length}
              </Text>
            </View>

            {preferredStores.length > 0 ? (
              <Card style={{ backgroundColor: theme.colors.surface }}>
                {preferredStores.map((store, index) => (
                  <View
                    key={store.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      borderBottomWidth: index !== preferredStores.length - 1 ? 1 : 0,
                      borderBottomColor: index !== preferredStores.length - 1 ? theme.colors.border : 'transparent'
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '500', 
                        color: theme.colors['text-primary'] 
                      }}>
                        {store.store_name}
                      </Text>
                      <Text style={{ 
                        fontSize: 14, 
                        color: theme.colors['text-secondary'], 
                        marginTop: 4 
                      }}>
                        {store.store_location}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        handleRemoveStore(store.store_id, store.store_name)
                      }
                      style={{ marginLeft: 12, padding: 8 }}
                    >
                      <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </Card>
            ) : (
              <Card style={{ alignItems: 'center', paddingVertical: 32, backgroundColor: theme.colors.surface }}>
                <View style={{ 
                  backgroundColor: `${theme.colors.accent}20`, 
                  borderRadius: 9999, 
                  padding: 24, 
                  marginBottom: 16 
                }}>
                  <Ionicons
                    name="storefront-outline"
                    size={48}
                    color={theme.colors.accent}
                  />
                </View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: theme.colors['text-primary'], 
                  marginBottom: 8 
                }}>
                  No Preferred Stores
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.colors['text-secondary'], 
                  textAlign: 'center' 
                }}>
                  Add stores to see personalized prices and information
                </Text>
              </Card>
            )}
          </View>

          {/* Add Store Section */}
          <View>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: theme.colors['text-primary'], 
              marginBottom: 12 
            }}>
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
              <Card style={{ backgroundColor: theme.colors.surface }}>
                <View style={{ padding: 16 }}>
                  {/* Search Input */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      borderWidth: 1, 
                      borderColor: theme.colors.border, 
                      borderRadius: 8, 
                      backgroundColor: theme.colors.background, 
                      paddingHorizontal: 12 
                    }}>
                      <Ionicons
                        name="search"
                        size={20}
                        color={theme.colors['text-muted']}
                      />
                      <TextInput
                        style={{ 
                          flex: 1, 
                          marginLeft: 8, 
                          paddingVertical: 8, 
                          color: theme.colors['text-primary'] 
                        }}
                        placeholder="Search stores..."
                        placeholderTextColor={theme.colors['text-muted']}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                  </View>

                  {/* Available Stores List */}
                  {availableToAdd.length > 0 ? (
                    <View style={{ marginBottom: 16 }}>
                      {availableToAdd.map((store, index) => (
                        <View
                          key={store.id}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 12,
                            borderBottomWidth: index !== availableToAdd.length - 1 ? 1 : 0,
                            borderBottomColor: index !== availableToAdd.length - 1 ? theme.colors.border : 'transparent'
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ 
                              fontSize: 16, 
                              fontWeight: '500', 
                              color: theme.colors['text-primary'] 
                            }}>
                              {store.name}
                            </Text>
                            <Text style={{ 
                              fontSize: 14, 
                              color: theme.colors['text-secondary'], 
                              marginTop: 4 
                            }}>
                              {store.location}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleAddStore(store)}
                            disabled={isAddingStore}
                            style={{ 
                              marginLeft: 12, 
                              backgroundColor: theme.colors.accent, 
                              borderRadius: 8, 
                              padding: 8,
                              opacity: isAddingStore ? 0.6 : 1
                            }}
                          >
                            {isAddingStore ? (
                              <ActivityIndicator
                                size="small"
                                color={theme.colors['text-primary']}
                              />
                            ) : (
                              <Ionicons
                                name="add"
                                size={20}
                                color={theme.colors['text-primary']}
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                      <Text style={{ 
                        fontSize: 14, 
                        color: theme.colors['text-secondary'] 
                      }}>
                        {searchQuery
                          ? 'No stores match your search'
                          : allStores.length === 0 
                          ? 'No stores available' 
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
    </View>
  );
}