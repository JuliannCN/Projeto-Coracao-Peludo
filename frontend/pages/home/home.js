function goToLogin() {
  window.location.href = "../auth/login.html";
}

function goToRegister() {
  window.location.href = "../auth/register.html";
}

function toggleMenu() {
  const nav = document.getElementById("navMenu");
  nav.style.display = nav.style.display === "block" ? "none" : "block";
}

/* Pets mockados */
const pets = [
  {
    name: "Thor",
    image: "https://images.unsplash.com/photo-1558788353-f76d92427f16"
  },
  {
    name: "Luna",
    image: "https://images.unsplash.com/photo-1517849845537-4d257902454a"
  },
  {
    name: "Mia",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba"
  }
];

const container = document.getElementById("petContainer");

pets.forEach(pet => {
  const card = document.createElement("div");
  card.classList.add("pet-card");

  card.innerHTML = `
    <img src="${pet.image}" alt="${pet.name}">
    <h3>${pet.name}</h3>
  `;

  container.appendChild(card);
});
