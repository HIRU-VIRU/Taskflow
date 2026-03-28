// Manual subscription check script
// Paste this in your browser console to test subscription API

// Get the token from localStorage
const token = localStorage.getItem('taskflow_token');
console.log('🔑 Token exists:', !!token);

if (token) {
  // Test subscription API directly
  fetch('http://localhost:3000/api/subscriptions/current', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📊 Subscription data:', data);
    if (data.success) {
      console.log('✅ Current plan:', data.data?.plan_name);
      console.log('📋 Full subscription:', data.data);
    } else {
      console.log('❌ API Error:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Network Error:', error);
  });
} else {
  console.log('❌ No authentication token found - please login');
}