"""
Serializers for accounts app
backend/accounts/serializers.py
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile, UserPreferredStore
from products.models import Store


class PreferredStoreSerializer(serializers.ModelSerializer):
    """Serializer for user preferred stores"""
    store_id = serializers.IntegerField(source='store.id', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_location = serializers.CharField(source='store.location', read_only=True)
    
    class Meta:
        model = UserPreferredStore
        fields = ['id', 'store_id', 'store_name', 'store_location', 'added_at']
        read_only_fields = ['id', 'added_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    preferred_stores = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'budget_limit', 'preferred_stores']
    
    def get_preferred_stores(self, obj):
        """Get user's preferred stores"""
        preferred = UserPreferredStore.objects.filter(user=obj.user).select_related('store')
        return PreferredStoreSerializer(preferred, many=True).data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user with profile"""
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError(
                {"email": "A user with this email already exists."}
            )
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, 
        write_only=True, 
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError(
                {"new_password": "Password fields didn't match."}
            )
        return attrs


class AddPreferredStoreSerializer(serializers.Serializer):
    """Serializer for adding preferred store"""
    store_id = serializers.IntegerField(required=True)
    
    def validate_store_id(self, value):
        if not Store.objects.filter(id=value).exists():
            raise serializers.ValidationError("Store does not exist.")
        return value
    