const impactData = {
  mealsServed: 12500,
  donorsCount: 785,
  fundsRaised: 1842500,
};

function animateValue(id, endValue, prefix = '') {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  const duration = 1200;
  const start = 0;
  const stepTime = 20;
  const totalSteps = duration / stepTime;
  let currentStep = 0;

  const timer = setInterval(() => {
    currentStep += 1;
    const progress = currentStep / totalSteps;
    const value = Math.floor(start + (endValue - start) * progress);
    element.textContent = `${prefix}${value.toLocaleString('mr-IN')}`;

    if (currentStep >= totalSteps) {
      clearInterval(timer);
      element.textContent = `${prefix}${endValue.toLocaleString('mr-IN')}`;
    }
  }, stepTime);
}

animateValue('mealsServed', impactData.mealsServed);
animateValue('donorsCount', impactData.donorsCount);
animateValue('fundsRaised', impactData.fundsRaised, '₹');

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const donationForm = document.getElementById('donationForm');
const paymentResult = document.getElementById('paymentResult');

if (donationForm && paymentResult) {
  donationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(donationForm);
    const payload = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      amount: Number(formData.get('amount')),
      message: formData.get('message'),
    };

    try {
      const response = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('सध्या देणगी प्रक्रिया पूर्ण होत नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.');
      }

      const data = await response.json();

      paymentResult.classList.remove('hidden');
      paymentResult.innerHTML = `
        <h3>देणगी विनंती यशस्वीरित्या तयार झाली ✅</h3>
        <p><strong>पावती क्रमांक:</strong> ${data.receiptId}</p>
        <p><strong>रक्कम:</strong> ₹${data.amount.toLocaleString('mr-IN')}</p>
        <p>देयक पूर्ण करण्यासाठी आपल्या पसंतीचे अ‍ॅप निवडा:</p>
        <p>
          <a class="btn btn-secondary" href="${data.upiLinks.gpay}">Google Pay</a>
          <a class="btn btn-secondary" href="${data.upiLinks.phonePe}">PhonePe</a>
          <a class="btn btn-secondary" href="${data.upiLinks.paytm}">Paytm</a>
        </p>
        <p>UPI आयडी: <strong>${data.upiId}</strong></p>
      `;
    } catch (error) {
      paymentResult.classList.remove('hidden');
      paymentResult.innerHTML = `<p>${error.message}</p>`;
    }
  });
}
