import requests
import sys
import json
from datetime import datetime

class CoracoesPeludosAPITester:
    def __init__(self, base_url="https://fluffy-hearts.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.ong_token = None
        self.ong_id = None
        self.pet_id = None
        self.forum_post_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and not headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        return self.run_test("Stats", "GET", "stats", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@test.com",
            "password": "TestPass123!",
            "user_type": "user",
            "phone": "11999999999",
            "city": "São Paulo",
            "state": "SP"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_ong_registration(self):
        """Test ONG registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        ong_data = {
            "name": f"Test ONG Admin {timestamp}",
            "email": f"testong{timestamp}@test.com",
            "password": "TestPass123!",
            "user_type": "ong",
            "phone": "11888888888",
            "city": "Rio de Janeiro",
            "state": "RJ",
            "ong_name": f"ONG Test {timestamp}",
            "cnpj": "12.345.678/0001-90",
            "description": "ONG de teste para adoção de animais"
        }
        
        success, response = self.run_test(
            "ONG Registration",
            "POST",
            "auth/register",
            200,
            data=ong_data
        )
        
        if success and 'token' in response:
            self.ong_token = response['token']
            self.ong_id = response['id']
            print(f"   ONG ID: {self.ong_id}")
            return True
        return False

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        login_data = {
            "email": "admin@coracoespeludos.com",
            "password": "Admin@123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            print(f"   Admin login successful")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        if not self.user_id:
            print("❌ Skipping user login - no user registered")
            return False
            
        # We need to get the email from registration
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"testuser{timestamp}@test.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success

    def test_auth_me(self):
        """Test getting current user info"""
        if not self.token:
            print("❌ Skipping auth/me - no token available")
            return False
            
        return self.run_test("Get Current User", "GET", "auth/me", 200)[0]

    def test_create_pet(self):
        """Test pet creation by ONG"""
        if not self.ong_token:
            print("❌ Skipping pet creation - no ONG token")
            return False
            
        pet_data = {
            "name": "Rex",
            "pet_type": "dog",
            "breed": "Labrador",
            "age": "adult",
            "size": "large",
            "gender": "male",
            "description": "Cachorro muito carinhoso e brincalhão",
            "health_info": "Vacinado e vermifugado",
            "vaccinated": True,
            "neutered": True,
            "special_needs": None,
            "city": "São Paulo",
            "state": "SP"
        }
        
        headers = {'Authorization': f'Bearer {self.ong_token}', 'Content-Type': 'application/json'}
        success, response = self.run_test(
            "Create Pet",
            "POST",
            "pets",
            200,
            data=pet_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.pet_id = response['id']
            print(f"   Pet ID: {self.pet_id}")
            return True
        return False

    def test_list_pets(self):
        """Test listing pets"""
        return self.run_test("List Pets", "GET", "pets", 200)[0]

    def test_get_pet_details(self):
        """Test getting pet details"""
        if not self.pet_id:
            print("❌ Skipping pet details - no pet created")
            return False
            
        return self.run_test("Get Pet Details", "GET", f"pets/{self.pet_id}", 200)[0]

    def test_create_adoption_request(self):
        """Test creating adoption request"""
        if not self.token or not self.pet_id:
            print("❌ Skipping adoption request - missing token or pet")
            return False
            
        adoption_data = {
            "pet_id": self.pet_id,
            "message": "Gostaria muito de adotar este pet. Tenho experiência com animais."
        }
        
        return self.run_test(
            "Create Adoption Request",
            "POST",
            "adoptions",
            200,
            data=adoption_data
        )[0]

    def test_get_user_adoptions(self):
        """Test getting user's adoption requests"""
        if not self.token:
            print("❌ Skipping user adoptions - no token")
            return False
            
        return self.run_test("Get User Adoptions", "GET", "adoptions/user", 200)[0]

    def test_get_ong_adoptions(self):
        """Test getting ONG's adoption requests"""
        if not self.ong_token:
            print("❌ Skipping ONG adoptions - no ONG token")
            return False
            
        headers = {'Authorization': f'Bearer {self.ong_token}', 'Content-Type': 'application/json'}
        return self.run_test(
            "Get ONG Adoptions",
            "GET",
            "adoptions/ong",
            200,
            headers=headers
        )[0]

    def test_create_forum_post(self):
        """Test creating forum post"""
        if not self.token:
            print("❌ Skipping forum post - no token")
            return False
            
        post_data = {
            "title": "Dicas para novos adotantes",
            "content": "Aqui estão algumas dicas importantes para quem está adotando pela primeira vez...",
            "category": "dicas"
        }
        
        success, response = self.run_test(
            "Create Forum Post",
            "POST",
            "forum/posts",
            200,
            data=post_data
        )
        
        if success and 'id' in response:
            self.forum_post_id = response['id']
            print(f"   Forum Post ID: {self.forum_post_id}")
            return True
        return False

    def test_list_forum_posts(self):
        """Test listing forum posts"""
        return self.run_test("List Forum Posts", "GET", "forum/posts", 200)[0]

    def test_get_forum_post(self):
        """Test getting forum post details"""
        if not self.forum_post_id:
            print("❌ Skipping forum post details - no post created")
            return False
            
        return self.run_test("Get Forum Post", "GET", f"forum/posts/{self.forum_post_id}", 200)[0]

    def test_create_comment(self):
        """Test creating comment on forum post"""
        if not self.token or not self.forum_post_id:
            print("❌ Skipping comment - missing token or post")
            return False
            
        comment_data = {
            "content": "Muito útil! Obrigado pelas dicas."
        }
        
        return self.run_test(
            "Create Comment",
            "POST",
            f"forum/posts/{self.forum_post_id}/comments",
            200,
            data=comment_data
        )[0]

    def test_send_message(self):
        """Test sending message"""
        if not self.token or not self.ong_id:
            print("❌ Skipping message - missing token or ONG ID")
            return False
            
        message_data = {
            "receiver_id": self.ong_id,
            "content": "Olá! Gostaria de saber mais sobre o processo de adoção.",
            "pet_id": self.pet_id
        }
        
        return self.run_test(
            "Send Message",
            "POST",
            "messages",
            200,
            data=message_data
        )[0]

    def test_get_messages(self):
        """Test getting messages"""
        if not self.token:
            print("❌ Skipping get messages - no token")
            return False
            
        return self.run_test("Get Messages", "GET", "messages", 200)[0]

    def test_get_notifications(self):
        """Test getting notifications"""
        if not self.token:
            print("❌ Skipping notifications - no token")
            return False
            
        return self.run_test("Get Notifications", "GET", "notifications", 200)[0]

    def test_favorites(self):
        """Test favorites functionality"""
        if not self.token or not self.pet_id:
            print("❌ Skipping favorites - missing token or pet")
            return False
            
        # Add to favorites
        success1 = self.run_test(
            "Add to Favorites",
            "POST",
            f"users/favorites/{self.pet_id}",
            200
        )[0]
        
        # Get favorites
        success2 = self.run_test("Get Favorites", "GET", "users/favorites", 200)[0]
        
        # Remove from favorites
        success3 = self.run_test(
            "Remove from Favorites",
            "DELETE",
            f"users/favorites/{self.pet_id}",
            200
        )[0]
        
        return success1 and success2 and success3

def main():
    print("🚀 Starting Corações Peludos API Tests")
    print("=" * 50)
    
    tester = CoracoesPeludosAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Stats Endpoint", tester.test_stats_endpoint),
        ("User Registration", tester.test_user_registration),
        ("ONG Registration", tester.test_ong_registration),
        ("Admin Login", tester.test_admin_login),
        ("Auth Me", tester.test_auth_me),
        ("Create Pet", tester.test_create_pet),
        ("List Pets", tester.test_list_pets),
        ("Get Pet Details", tester.test_get_pet_details),
        ("Create Adoption Request", tester.test_create_adoption_request),
        ("Get User Adoptions", tester.test_get_user_adoptions),
        ("Get ONG Adoptions", tester.test_get_ong_adoptions),
        ("Create Forum Post", tester.test_create_forum_post),
        ("List Forum Posts", tester.test_list_forum_posts),
        ("Get Forum Post", tester.test_get_forum_post),
        ("Create Comment", tester.test_create_comment),
        ("Send Message", tester.test_send_message),
        ("Get Messages", tester.test_get_messages),
        ("Get Notifications", tester.test_get_notifications),
        ("Favorites", tester.test_favorites),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            tester.failed_tests.append({
                "test": test_name,
                "error": str(e)
            })
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"✅ Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for failure in tester.failed_tests:
            error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
            print(f"   - {failure['test']}: {error_msg}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())