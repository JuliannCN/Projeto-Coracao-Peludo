const API_BASE = "http://localhost:8000/api";

// ===================== UTIL =====================

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

// ===================== API =====================

async function apiRequest(endpoint, method = "GET", body = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro na requisição");
  }

  return response.json();
}

// ===================== RENDER =====================

function renderHome() {
  const root = document.getElementById("root");

  root.innerHTML = `
    <div style="font-family: Inter, sans-serif; padding: 20px;">
      <h1>🐶 Corações Peludos</h1>
      <p>Encontre seu novo melhor amigo ❤️</p>
      
      <button id="loadPets">Carregar Pets</button>
      <div id="petsList"></div>
    </div>
  `;

  document.getElementById("loadPets").addEventListener("click", loadPets);
}

// ===================== PETS =====================

async function loadPets() {
  const container = document.getElementById("petsList");
  container.innerHTML = "Carregando...";

  try {
    const pets = await apiRequest("/pets");

    if (!pets.length) {
      container.innerHTML = "<p>Nenhum pet encontrado.</p>";
      return;
    }

    container.innerHTML = pets.map(pet => `
      <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
        <h3>${pet.name}</h3>
        <p>${pet.description || "Sem descrição"}</p>
        <button onclick="adoptPet('${pet._id}')">Adotar</button>
      </div>
    `).join("");

  } catch (err) {
    container.innerHTML = `<p style="color:red;">Erro: ${err.message}</p>`;
  }
}

// ===================== ADOÇÃO =====================

async function adoptPet(petId) {
  try {
    await apiRequest(`/pets/${petId}/adopt`, "POST");
    alert("Pedido de adoção enviado! 🐾");
  } catch (err) {
    alert(err.message);
  }
}

// ===================== INIT =====================

document.addEventListener("DOMContentLoaded", () => {
  renderHome();
});