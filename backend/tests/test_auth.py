"""
Backend API Tests for Elo - Christian Social Network
Tests for phone+password authentication system

Test Coverage:
- POST /api/auth/register - register new user with phone+password+name
- POST /api/auth/register - validation errors (short phone, short password, duplicate phone)
- POST /api/auth/login - login with correct phone+password
- POST /api/auth/login - login with wrong password returns 401
- GET /api/auth/me - returns user data with valid session cookie
- POST /api/auth/logout - clears session
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://elo-cristao.preview.emergentagent.com').rstrip('/')

# Test user credentials from seed data
TEST_USER_PHONE = "11999999999"
TEST_USER_PASSWORD = "teste123"

# Generate unique phone for new user tests
def generate_test_phone():
    """Generate a unique phone number for testing (11 digits - Brazilian format)"""
    # Format: 11 + 9 + 8 random digits = 11 digits total
    import random
    random_digits = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    return f"119{random_digits}"


class TestAuthRegister:
    """Tests for POST /api/auth/register endpoint"""
    
    def test_register_success(self):
        """Test successful registration with valid phone+password+name"""
        unique_phone = generate_test_phone()
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "phone": unique_phone,
                "password": "senha123",
                "name": "TEST_Novo Usuario"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data, "Response should contain user_id"
        assert data["name"] == "TEST_Novo Usuario", "Name should match"
        assert data["phone"] == unique_phone.replace("(", "").replace(")", "").replace(" ", "").replace("-", ""), "Phone should be normalized"
        assert "password_hash" not in data, "Password hash should not be in response"
        
        # Verify session cookie is set
        cookies = response.cookies
        assert "session_token" in cookies or any("session_token" in str(c) for c in response.headers.get("set-cookie", "")), "Session cookie should be set"
        
        print(f"✓ Registration successful for phone: {unique_phone}")
    
    def test_register_short_phone(self):
        """Test registration fails with short phone number"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "phone": "123",  # Too short
                "password": "senha123",
                "name": "TEST_User"
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Should have error detail"
        print(f"✓ Short phone rejected: {data['detail']}")
    
    def test_register_short_password(self):
        """Test registration fails with short password"""
        unique_phone = generate_test_phone()
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "phone": unique_phone,
                "password": "123",  # Too short (< 6 chars)
                "name": "TEST_User"
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Should have error detail"
        print(f"✓ Short password rejected: {data['detail']}")
    
    def test_register_duplicate_phone(self):
        """Test registration fails with duplicate phone number"""
        # Use the seeded test user phone
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "phone": TEST_USER_PHONE,
                "password": "senha123",
                "name": "TEST_Duplicate"
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Should have error detail"
        assert "cadastrado" in data["detail"].lower() or "já" in data["detail"].lower(), "Should mention phone already registered"
        print(f"✓ Duplicate phone rejected: {data['detail']}")
    
    def test_register_short_name(self):
        """Test registration fails with short name"""
        unique_phone = generate_test_phone()
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "phone": unique_phone,
                "password": "senha123",
                "name": "A"  # Too short (< 2 chars)
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Should have error detail"
        print(f"✓ Short name rejected: {data['detail']}")


class TestAuthLogin:
    """Tests for POST /api/auth/login endpoint"""
    
    def test_login_success(self):
        """Test successful login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "phone": TEST_USER_PHONE,
                "password": TEST_USER_PASSWORD
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data, "Response should contain user_id"
        assert "name" in data, "Response should contain name"
        assert "password_hash" not in data, "Password hash should not be in response"
        
        # Verify session cookie is set
        set_cookie = response.headers.get("set-cookie", "")
        assert "session_token" in set_cookie, f"Session cookie should be set. Headers: {response.headers}"
        
        print(f"✓ Login successful for user: {data['name']}")
        return response.cookies
    
    def test_login_wrong_password(self):
        """Test login fails with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "phone": TEST_USER_PHONE,
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Should have error detail"
        print(f"✓ Wrong password rejected: {data['detail']}")
    
    def test_login_nonexistent_phone(self):
        """Test login fails with non-existent phone"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "phone": "99999999999",  # Non-existent
                "password": "anypassword"
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Should have error detail"
        print(f"✓ Non-existent phone rejected: {data['detail']}")
    
    def test_login_with_formatted_phone(self):
        """Test login works with formatted phone number (with mask)"""
        # Phone with Brazilian format mask
        formatted_phone = "(11) 99999-9999"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "phone": formatted_phone,
                "password": TEST_USER_PASSWORD
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Login with formatted phone successful")


class TestAuthMe:
    """Tests for GET /api/auth/me endpoint"""
    
    def test_me_with_valid_session(self):
        """Test /auth/me returns user data with valid session"""
        # First login to get session
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "phone": TEST_USER_PHONE,
                "password": TEST_USER_PASSWORD
            }
        )
        
        assert login_response.status_code == 200, "Login should succeed"
        
        # Extract session token from cookies
        session_token = login_response.cookies.get("session_token")
        
        # Call /auth/me with session cookie
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": session_token} if session_token else None,
            headers={"Cookie": f"session_token={session_token}"} if session_token else {}
        )
        
        assert me_response.status_code == 200, f"Expected 200, got {me_response.status_code}: {me_response.text}"
        
        data = me_response.json()
        assert "user_id" in data, "Response should contain user_id"
        assert "name" in data, "Response should contain name"
        assert "phone" in data, "Response should contain phone"
        assert "password_hash" not in data, "Password hash should not be in response"
        
        print(f"✓ /auth/me returned user: {data['name']}")
    
    def test_me_with_bearer_token(self):
        """Test /auth/me works with Bearer token in Authorization header"""
        # First login to get session
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "phone": TEST_USER_PHONE,
                "password": TEST_USER_PASSWORD
            }
        )
        
        assert login_response.status_code == 200, "Login should succeed"
        
        # Extract session token
        session_token = login_response.cookies.get("session_token")
        
        # Call /auth/me with Bearer token
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {session_token}"}
        )
        
        assert me_response.status_code == 200, f"Expected 200, got {me_response.status_code}"
        print("✓ /auth/me works with Bearer token")
    
    def test_me_without_session(self):
        """Test /auth/me returns 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Should have error detail"
        print(f"✓ /auth/me without session rejected: {data['detail']}")
    
    def test_me_with_invalid_session(self):
        """Test /auth/me returns 401 with invalid session token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": "invalid_token_12345"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /auth/me with invalid session rejected")


class TestAuthLogout:
    """Tests for POST /api/auth/logout endpoint"""
    
    def test_logout_clears_session(self):
        """Test logout clears the session"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "phone": TEST_USER_PHONE,
                "password": TEST_USER_PASSWORD
            }
        )
        
        assert login_response.status_code == 200, "Login should succeed"
        session_token = login_response.cookies.get("session_token")
        
        # Logout
        logout_response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            cookies={"session_token": session_token}
        )
        
        assert logout_response.status_code == 200, f"Expected 200, got {logout_response.status_code}"
        
        # Verify session is cleared - check set-cookie header
        set_cookie = logout_response.headers.get("set-cookie", "")
        # Cookie should be deleted (max-age=0 or expires in past)
        
        # Try to use the old session - should fail
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": session_token}
        )
        
        assert me_response.status_code == 401, f"Session should be invalid after logout, got {me_response.status_code}"
        print("✓ Logout successfully cleared session")
    
    def test_logout_without_session(self):
        """Test logout works even without session (no error)"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Logout without session returns 200")


class TestAuthIntegration:
    """Integration tests for full auth flow"""
    
    def test_full_registration_flow(self):
        """Test complete flow: register -> auto-login -> access protected route"""
        unique_phone = generate_test_phone()
        
        # 1. Register
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "phone": unique_phone,
                "password": "senha123",
                "name": "TEST_Integration User"
            }
        )
        
        assert register_response.status_code == 200, f"Registration failed: {register_response.text}"
        session_token = register_response.cookies.get("session_token")
        
        # 2. Access protected route with session from registration
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": session_token}
        )
        
        assert me_response.status_code == 200, f"Should be authenticated after registration: {me_response.text}"
        
        user_data = me_response.json()
        assert user_data["name"] == "TEST_Integration User"
        
        print("✓ Full registration flow successful")
    
    def test_login_logout_login_flow(self):
        """Test login -> logout -> login again flow"""
        # 1. Login
        login1 = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"phone": TEST_USER_PHONE, "password": TEST_USER_PASSWORD}
        )
        assert login1.status_code == 200
        token1 = login1.cookies.get("session_token")
        
        # 2. Logout
        logout = requests.post(
            f"{BASE_URL}/api/auth/logout",
            cookies={"session_token": token1}
        )
        assert logout.status_code == 200
        
        # 3. Login again
        login2 = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"phone": TEST_USER_PHONE, "password": TEST_USER_PASSWORD}
        )
        assert login2.status_code == 200
        token2 = login2.cookies.get("session_token")
        
        # 4. Verify new session works
        me = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": token2}
        )
        assert me.status_code == 200
        
        print("✓ Login-logout-login flow successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
