---
layout: page
title: Contact
---

<div class="contact-page">
  <h1 class="contact-title">Contact</h1>
  <p class="contact-subtitle">Commercial licensing inquiries or questions</p>

  <form action="https://formspree.io/f/xjgggyre" method="POST" class="contact-form">
    <div class="form-group">
      <label for="email">Email</label>
      <input
        type="email"
        id="email"
        name="email"
        required
        placeholder="you@example.com"
      />
    </div>
    <div class="form-group">
      <label for="message">Message</label>
      <textarea
        id="message"
        name="message"
        rows="4"
        required
        placeholder="How can we help?"
      ></textarea>
    </div>
    <button type="submit" class="submit-btn">Send Message</button>
  </form>
</div>

<style>
.contact-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.contact-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 0.5rem 0;
  color: white;
}

.contact-subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 2rem 0;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #f97316;
}

.form-group textarea {
  resize: none;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #f97316;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #ea580c;
}
</style>
