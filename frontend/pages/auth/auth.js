const API_URL = "http://localhost:3000/api/auth";

// ==============================
// REGISTER
// ==============================
async function registerUser(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.querySelector("input[name='role']:checked").value;

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao cadastrar.");
    }

    alert("Cadastro realizado com sucesso!");
    window.location.href = "login.html";

  } catch (error) {
    alert(error.message);
  }
}

// ==============================
// LOGIN
// ==============================
async function loginUser(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao fazer login.");
    }

    // 🔐 Salvar token
    localStorage.setItem("token", data.token);

    // 👤 Salvar usuário
    localStorage.setItem("user", JSON.stringify(data.user));

    redirectByRole(data.user.role);

  } catch (error) {
    alert(error.message);
  }
}

// ==============================
// REDIRECIONAMENTO POR PERFIL
// ==============================
function redirectByRole(role) {
  if (role === "TUTOR") {
    window.location.href = "/dashboard-tutor.html";
  } else if (role === "ONG") {
    window.location.href = "/dashboard-ong.html";
  } else {
    window.location.href = "/";
  }
}