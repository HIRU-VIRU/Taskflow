// Quick API test script
console.log('🧪 Testing API client directly...');

// Test the raw fetch first
fetch('http://localhost:3000/api/plans')
  .then(response => {
    console.log('📡 Raw fetch response status:', response.status);
    console.log('📡 Raw fetch response headers:', [...response.headers.entries()]);
    return response.json();
  })
  .then(data => {
    console.log('📊 Raw fetch data:', data);
    console.log('📊 Plans array:', data?.data?.plans);
  })
  .catch(error => {
    console.error('❌ Raw fetch error:', error);
  });

// Test with API client
import('./api/plans.js').then(({ plansApi }) => {
  console.log('🔧 Testing plansApi.getPlans()...');
  plansApi.getPlans()
    .then(plans => {
      console.log('✅ plansApi success:', plans);
    })
    .catch(error => {
      console.error('❌ plansApi error:', error);
    });
});