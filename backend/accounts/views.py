"""
Views for accounts app
backend/accounts/views.py
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .serializers import (
    UserSerializer, 
    UserCreateSerializer,
    UserUpdateSerializer,
    UserRegistrationSerializer, 
    UserLoginSerializer,
    ChangePasswordSerializer,
    UserProfileSerializer,
    PreferredStoreSerializer,
    AddPreferredStoreSerializer
)
from .models import UserProfile, UserPreferredStore
from products.models import Store


# ===================== AUTHENTICATION VIEWS =====================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    """Login user and return token"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    """Logout user by deleting token"""
    try:
        request.user.auth_token.delete()
        return Response(
            {'message': 'Logout successful'}, 
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


# ===================== PROFILE MANAGEMENT VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_user_profile(request):
    """Update current user profile"""
    user = request.user
    user_data = {}
    profile_data = {}
    
    # Separate user and profile data
    user_fields = ['first_name', 'last_name', 'email']
    for field in user_fields:
        if field in request.data:
            user_data[field] = request.data[field]
    
    profile_fields = ['phone_number', 'budget_limit']
    for field in profile_fields:
        if field in request.data:
            profile_data[field] = request.data[field]
    
    # Update user
    if user_data:
        user_serializer = UserSerializer(user, data=user_data, partial=True)
        if user_serializer.is_valid():
            user_serializer.save()
        else:
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Update profile
    if profile_data:
        profile_serializer = UserProfileSerializer(
            user.profile, 
            data=profile_data, 
            partial=True
        )
        if profile_serializer.is_valid():
            profile_serializer.save()
        else:
            return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(
        UserSerializer(user).data,
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        
        # Check old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===================== PREFERRED STORES VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_preferred_stores(request):
    """Get user's preferred stores"""
    preferred_stores = UserPreferredStore.objects.filter(
        user=request.user
    ).select_related('store')
    serializer = PreferredStoreSerializer(preferred_stores, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_preferred_store(request):
    """Add a store to user's preferred stores"""
    serializer = AddPreferredStoreSerializer(data=request.data)
    if serializer.is_valid():
        store_id = serializer.validated_data['store_id']
        store = get_object_or_404(Store, id=store_id)
        
        # Check if already exists
        if UserPreferredStore.objects.filter(user=request.user, store=store).exists():
            return Response(
                {'error': 'Store already in preferred list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create preferred store
        preferred_store = UserPreferredStore.objects.create(
            user=request.user,
            store=store
        )
        
        return Response(
            PreferredStoreSerializer(preferred_store).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_preferred_store(request, store_id):
    """Remove a store from user's preferred stores"""
    preferred_store = get_object_or_404(
        UserPreferredStore,
        user=request.user,
        store_id=store_id
    )
    preferred_store.delete()
    return Response(
        {'message': 'Store removed from preferred list'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_preferred_store(request, store_id):
    """Check if a store is in user's preferred list"""
    is_preferred = UserPreferredStore.objects.filter(
        user=request.user,
        store_id=store_id
    ).exists()
    return Response({'is_preferred': is_preferred})


# ===================== USER MANAGEMENT VIEWS (ADMIN ONLY) =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_users(request):
    """List all users (superuser only)"""
    if not request.user.is_superuser:
        return Response(
            {'error': 'You do not have permission to perform this action.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Optional: Add search/filter functionality
    search_query = request.query_params.get('search', '')
    if search_query:
        users = User.objects.filter(
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query)
        )
    else:
        users = User.objects.all()
    
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_detail(request, user_id):
    """Get user details (superuser only)"""
    if not request.user.is_superuser:
        return Response(
            {'error': 'You do not have permission to perform this action.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    user = get_object_or_404(User, id=user_id)
    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_user(request):
    """Create a new user (superuser only)"""
    if not request.user.is_superuser:
        return Response(
            {'error': 'You do not have permission to perform this action.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_user(request, user_id):
    """Update a user (superuser only)"""
    if not request.user.is_superuser:
        return Response(
            {'error': 'You do not have permission to perform this action.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    user = get_object_or_404(User, id=user_id)
    serializer = UserUpdateSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_200_OK
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_user(request, user_id):
    """Delete a user (superuser only)"""
    if not request.user.is_superuser:
        return Response(
            {'error': 'You do not have permission to perform this action.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Prevent deleting the current user
    if request.user.id == user_id:
        return Response(
            {'error': 'You cannot delete your own account.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = get_object_or_404(User, id=user_id)
    username = user.username
    user.delete()
    return Response(
        {'message': f'User {username} deleted successfully'},
        status=status.HTTP_200_OK
    )