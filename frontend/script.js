// Global variables
let complaints = []
let draggedCard = null
let currentDeleteId = null
let currentPhotoId = null

const API_URL = "http://localhost:3000"

// DOM Elements
const citizenBtn = document.getElementById("citizenBtn")
const managerBtn = document.getElementById("managerBtn")
const citizenView = document.getElementById("citizenView")
const managerView = document.getElementById("managerView")
const complaintForm = document.getElementById("complaintForm")
const submitBtn = document.getElementById("submitBtn")
const searchBtn = document.getElementById("searchBtn")
const searchName = document.getElementById("searchName")
const userComplaints = document.getElementById("userComplaints")

// Modal elements
const confirmationModal = document.getElementById("confirmationModal")
const modalTitle = document.getElementById("modalTitle")
const modalDescription = document.getElementById("modalDescription")
const modalConfirm = document.getElementById("modalConfirm")
const modalCancel = document.getElementById("modalCancel")
const modalClose = document.getElementById("modalClose")

const photoModal = document.getElementById("photoModal")
const photoModalImage = document.getElementById("photoModalImage")
const photoModalClose = document.getElementById("photoModalClose")

// Tab elements
const tabBtns = document.querySelectorAll(".tab-btn")
const tabContents = document.querySelectorAll(".tab-content")

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners()
  loadManagerComplaints()
})

// Event Listeners
function initializeEventListeners() {
  // Navigation
  citizenBtn.addEventListener("click", () => switchView("citizen"))
  managerBtn.addEventListener("click", () => switchView("manager"))

  // Tabs
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab))
  })

  // Forms
  complaintForm.addEventListener("submit", handleSubmitComplaint)
  searchBtn.addEventListener("click", handleSearchComplaints)
  searchName.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearchComplaints()
  })

  // Modals
  modalClose.addEventListener("click", closeConfirmationModal)
  modalCancel.addEventListener("click", closeConfirmationModal)
  modalConfirm.addEventListener("click", confirmAction)
  photoModalClose.addEventListener("click", closePhotoModal)

  // Close modals on outside click
  confirmationModal.addEventListener("click", (e) => {
    if (e.target === confirmationModal) closeConfirmationModal()
  })
  photoModal.addEventListener("click", (e) => {
    if (e.target === photoModal) closePhotoModal()
  })
}

// Navigation Functions
function switchView(view) {
  if (view === "citizen") {
    citizenBtn.classList.add("active")
    managerBtn.classList.remove("active")
    citizenView.classList.add("active")
    managerView.classList.remove("active")
  } else {
    managerBtn.classList.add("active")
    citizenBtn.classList.remove("active")
    managerView.classList.add("active")
    citizenView.classList.remove("active")
    loadManagerComplaints()
  }
}

function switchTab(tabName) {
  tabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName)
  })

  tabContents.forEach((content) => {
    content.classList.toggle("active", content.id === tabName + "Tab")
  })
}

// Form Handling
async function handleSubmitComplaint(event) {
  event.preventDefault()

  submitBtn.disabled = true
  submitBtn.innerHTML = '<i class="spinner"></i> Enviando...'

  const formData = new FormData(event.target)

  try {
    const response = await fetch(`${API_URL}/denuncias`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Falha ao enviar denúncia. Status: ${response.status}`)
    }

    const result = await response.json()
    showAlert("Denúncia enviada com sucesso!", "success")
    complaintForm.reset()
  } catch (error) {
    console.error("Erro no envio:", error)
    showAlert("Ocorreu um erro ao enviar sua denúncia. Tente novamente.", "error")
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = "Registrar Denúncia"
  }
}

async function handleSearchComplaints() {
  const name = searchName.value.trim()

  if (!name) {
    showAlert("Por favor, digite um nome para consultar.", "warning")
    return
  }

  searchBtn.disabled = true
  searchBtn.innerHTML = '<i class="spinner"></i> Consultando...'

  try {
    const response = await fetch(`${API_URL}/denuncias/cidadao/${encodeURIComponent(name)}`)

    if (!response.ok) {
      throw new Error("Falha ao buscar denúncias.")
    }

    const denuncias = await response.json()
    displayUserComplaints(denuncias)
  } catch (error) {
    console.error("Erro na consulta:", error)
    showAlert("Não foi possível buscar suas denúncias.", "error")
    userComplaints.innerHTML = ""
  } finally {
    searchBtn.disabled = false
    searchBtn.innerHTML = '<i class="fas fa-search"></i> Consultar'
  }
}

// Display Functions
function displayUserComplaints(complaintsData) {
  if (complaintsData.length === 0) {
    userComplaints.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p>Nenhuma denúncia encontrada para este nome.</p>
            </div>
        `
    return
  }

  userComplaints.innerHTML = `
        <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Suas Denúncias</h3>
        ${complaintsData
      .map(
        (complaint) => `
            <div class="complaint-card fade-in">
                <div class="complaint-header">
                    <div class="complaint-info">
                        <h4><i class="fas fa-map-marker-alt"></i> ${complaint.local_problema}</h4>
                        <p><i class="fas fa-calendar"></i> ${formatDate(complaint.data_criacao)}</p>
                    </div>
                    <span class="status-badge ${complaint.status}">
                        ${getStatusText(complaint.status)}
                    </span>
                </div>
                <div class="complaint-description">${complaint.descricao}</div>
                <div class="complaint-footer">
                    <span><i class="fas fa-image"></i> Foto anexada</span>
                </div>
            </div>
        `,
      )
      .join("")}
    `
}

// Manager/Kanban Functions
async function loadManagerComplaints() {
  try {
    const response = await fetch(`${API_URL}/denuncias`)
    const data = await response.json()
    complaints = data
    updateKanbanBoard()
  } catch (error) {
    console.error("Erro ao carregar denúncias:", error)
    showAlert("Erro ao carregar denúncias.", "error")
  }
}

function updateKanbanBoard() {
  const columns = {
    pre_analise: document.getElementById("preAnaliseColumn"),
    analise: document.getElementById("analiseColumn"),
    resolvida: document.getElementById("resolvidaColumn"),
  }

  // Clear columns
  Object.values(columns).forEach((column) => (column.innerHTML = ""))

  // Group complaints by status
  const groupedComplaints = {
    pre_analise: [],
    analise: [],
    resolvida: [],
  }

  complaints.forEach((complaint) => {
    if (groupedComplaints[complaint.status]) {
      groupedComplaints[complaint.status].push(complaint)
    }
  })

  // Update column counts
  document.querySelector('[data-status="pre_analise"] .column-count').textContent = groupedComplaints.pre_analise.length
  document.querySelector('[data-status="analise"] .column-count').textContent = groupedComplaints.analise.length
  document.querySelector('[data-status="resolvida"] .column-count').textContent = groupedComplaints.resolvida.length

  // Populate columns
  Object.keys(groupedComplaints).forEach((status) => {
    const column = columns[status]
    const complaintsInStatus = groupedComplaints[status]

    if (complaintsInStatus.length === 0) {
      column.innerHTML = `
                <div class="empty-column">
                    <i class="fas fa-${getStatusIcon(status)}"></i>
                    <p>Nenhuma denúncia nesta etapa</p>
                </div>
            `
    } else {
      column.innerHTML = complaintsInStatus.map((complaint) => createKanbanCard(complaint)).join("")
    }
  })

  // Add drag and drop event listeners
  addDragAndDropListeners()
}

function createKanbanCard(complaint) {
  return `
        <div class="kanban-card" draggable="true" data-id="${complaint.id}">
            <div class="card-header-kanban">
                <div>
                    <div class="card-id">#${complaint.id}</div>
                    <div class="card-citizen">
                        <i class="fas fa-user"></i> ${complaint.nome_cidadao}
                    </div>
                </div>
                <span class="status-badge ${complaint.status}">
                    ${getStatusText(complaint.status)}
                </span>
            </div>
            
            <div class="card-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${complaint.local_problema}</span>
            </div>
            
            <div class="card-description">${complaint.descricao}</div>
            
            <div class="card-footer">
                <div class="card-date">
                    <i class="fas fa-calendar"></i>
                    ${formatDate(complaint.data_criacao)}
                </div>
                <div class="card-actions">
                    <button class="btn-icon" onclick="viewPhoto(${complaint.id})" title="Ver foto">
                        <i class="fas fa-image"></i>
                    </button>
                    <button class="btn-icon danger" onclick="deleteComplaint(${complaint.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `
}

// Drag and Drop Functions
function addDragAndDropListeners() {
  const cards = document.querySelectorAll(".kanban-card")
  const columns = document.querySelectorAll(".column-content")

  cards.forEach((card) => {
    card.addEventListener("dragstart", handleDragStart)
    card.addEventListener("dragend", handleDragEnd)
  })

  columns.forEach((column) => {
    column.addEventListener("dragover", handleDragOver)
    column.addEventListener("drop", handleDrop)
    column.addEventListener("dragenter", handleDragEnter)
    column.addEventListener("dragleave", handleDragLeave)
  })
}

function handleDragStart(e) {
  draggedCard = this
  this.classList.add("dragging")
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/html", this.outerHTML)
}

function handleDragEnd(e) {
  this.classList.remove("dragging")
  draggedCard = null

  // Remove drag-over class from all columns
  document.querySelectorAll(".kanban-column").forEach((col) => {
    col.classList.remove("drag-over")
  })
}

function handleDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = "move"
}

function handleDragEnter(e) {
  e.preventDefault()
  this.closest(".kanban-column").classList.add("drag-over")
}

function handleDragLeave(e) {
  if (!this.contains(e.relatedTarget)) {
    this.closest(".kanban-column").classList.remove("drag-over")
  }
}

function handleDrop(e) {
  e.preventDefault()

  if (draggedCard) {
    const column = this.closest(".kanban-column")
    const newStatus = column.dataset.status
    const cardId = Number.parseInt(draggedCard.dataset.id)

    column.classList.remove("drag-over")

    // Find the complaint and update its status
    const complaint = complaints.find((c) => c.id === cardId)
    if (complaint && complaint.status !== newStatus) {
      updateComplaintStatus(cardId, newStatus)
    }
  }
}

async function updateComplaintStatus(id, newStatus) {
  try {
    const response = await fetch(`${API_URL}/denuncias/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!response.ok) {
      throw new Error("Falha ao atualizar status")
    }

    // Update local data and refresh board
    const complaint = complaints.find((c) => c.id === id)
    if (complaint) {
      complaint.status = newStatus
    }

    updateKanbanBoard()
    showAlert("Status atualizado com sucesso!", "success")
  } catch (error) {
    console.error(`Erro ao atualizar status para ${newStatus}:`, error)
    showAlert("Erro ao atualizar status.", "error")
    loadManagerComplaints() // Reload to reset state
  }
}

// Modal Functions
function deleteComplaint(id) {
  currentDeleteId = id
  modalTitle.textContent = "Excluir Denúncia"
  modalDescription.textContent = `Você tem certeza que deseja excluir a denúncia #${id}? Esta ação não pode ser desfeita.`
  modalConfirm.textContent = "Confirmar Exclusão"
  modalConfirm.className = "btn-danger"
  showConfirmationModal()
}

function viewPhoto(id) {
  currentPhotoId = id
  photoModalImage.src = `${API_URL}/denuncias/${id}/foto`
  photoModalImage.alt = `Foto da denúncia #${id}`
  showPhotoModal()
}

function showConfirmationModal() {
  confirmationModal.classList.add("active")
  document.body.style.overflow = "hidden"
}

function closeConfirmationModal() {
  confirmationModal.classList.remove("active")
  document.body.style.overflow = ""
  currentDeleteId = null
}

function showPhotoModal() {
  photoModal.classList.add("active")
  document.body.style.overflow = "hidden"
}

function closePhotoModal() {
  photoModal.classList.remove("active")
  document.body.style.overflow = ""
  currentPhotoId = null
}

async function confirmAction() {
  if (currentDeleteId) {
    try {
      const response = await fetch(`${API_URL}/denuncias/${currentDeleteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Falha ao deletar denúncia")
      }

      // Remove from local array
      complaints = complaints.filter((c) => c.id !== currentDeleteId)
      updateKanbanBoard()
      showAlert("Denúncia excluída com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao deletar denúncia:", error)
      showAlert("Erro ao deletar denúncia.", "error")
    }
  }

  closeConfirmationModal()
}

// Utility Functions
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

function getStatusText(status) {
  const statusMap = {
    pre_analise: "Pré-análise",
    analise: "Em Análise",
    resolvida: "Resolvida",
  }
  return statusMap[status] || status
}

function getStatusIcon(status) {
  const iconMap = {
    pre_analise: "exclamation-circle",
    analise: "clock",
    resolvida: "check-circle",
  }
  return iconMap[status] || "circle"
}

function showAlert(message, type = "info") {
  // Create alert element
  const alert = document.createElement("div")
  alert.className = `alert alert-${type} fade-in`
  alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        color: white;
        font-weight: 500;
        z-index: 1001;
        max-width: 400px;
        box-shadow: 0 4px 12px var(--shadow-lg);
    `

  // Set background color based on type
  const colors = {
    success: "#059669",
    error: "#dc2626",
    warning: "#d97706",
    info: "#2563eb",
  }
  alert.style.backgroundColor = colors[type] || colors.info

  // Set icon based on type
  const icons = {
    success: "check-circle",
    error: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
  }

  alert.innerHTML = `
        <i class="fas fa-${icons[type] || icons.info}" style="margin-right: 8px;"></i>
        ${message}
    `

  document.body.appendChild(alert)

  // Remove after 5 seconds
  setTimeout(() => {
    alert.style.opacity = "0"
    alert.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert)
      }
    }, 300)
  }, 5000)
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // ESC to close modals
  if (e.key === "Escape") {
    if (confirmationModal.classList.contains("active")) {
      closeConfirmationModal()
    }
    if (photoModal.classList.contains("active")) {
      closePhotoModal()
    }
  }

  // Ctrl/Cmd + 1 for citizen view
  if ((e.ctrlKey || e.metaKey) && e.key === "1") {
    e.preventDefault()
    switchView("citizen")
  }

  // Ctrl/Cmd + 2 for manager view
  if ((e.ctrlKey || e.metaKey) && e.key === "2") {
    e.preventDefault()
    switchView("manager")
  }
})
