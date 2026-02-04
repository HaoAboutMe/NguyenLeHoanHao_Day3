/**
 * Main Controller - Điều phối logic chính với Bootstrap và tính năng mới
 */

import * as API from './api.js';
import * as UI from './ui.js';

// ===== State Management =====
let allProducts = [];
let filteredProducts = [];
let displayedProducts = [];
let categories = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortField = null;
let sortDirection = 'asc';

// Bootstrap Modal instances
let productModal, detailModal, confirmModal;

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard initialized with Bootstrap');
    
    // Initialize Bootstrap modals
    productModal = new bootstrap.Modal(document.getElementById('product-modal'));
    detailModal = new bootstrap.Modal(document.getElementById('detail-modal'));
    confirmModal = new bootstrap.Modal(document.getElementById('confirm-modal'));
    
    // Load initial data
    await loadCategories();
    await loadProducts();
    
    // Setup event listeners
    setupEventListeners();
});

// ===== Load Data Functions =====

async function loadCategories() {
    const result = await API.getAllCategories();
    if (result.success) {
        categories = result.data;
        UI.renderCategories(categories);
    }
}

async function loadProducts() {
    UI.showLoading();
    const result = await API.getAllProducts(200, 0);
    
    if (result.success) {
        allProducts = result.data;
        filteredProducts = allProducts;
        applyFiltersAndSort();
        UI.hideLoading();
    } else {
        UI.showError(result.error);
    }
}

// ===== Filter, Sort, and Display =====

function applyFiltersAndSort() {
    // Apply sorting
    if (sortField) {
        filteredProducts.sort((a, b) => {
            let aVal = sortField === 'price' ? a.price : a.title.toLowerCase();
            let bVal = sortField === 'price' ? b.price : b.title.toLowerCase();
            
            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }
    
    // Reset to page 1 when filters change
    currentPage = 1;
    displayProducts();
}

function displayProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    displayedProducts = filteredProducts.slice(startIndex, endIndex);
    
    UI.renderProducts(displayedProducts);
    
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    UI.renderPagination(currentPage, totalPages, (page) => {
        currentPage = page;
        displayProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== Event Listeners Setup =====

function setupEventListeners() {
    // Add product button
    document.getElementById('btn-add-product').addEventListener('click', openAddProductModal);
    
    // Export CSV button
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        UI.exportToCSV(displayedProducts, `products_${new Date().toISOString().split('T')[0]}.csv`);
    });
    
    // Form submit
    document.getElementById('submit-btn').addEventListener('click', handleFormSubmit);
    
    // Add image input
    document.getElementById('add-image-input').addEventListener('click', addImageInput);
    
    // Search input with debounce
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => handleSearch(e), 300);
    });
    
    // Category filter
    document.getElementById('category-filter').addEventListener('change', handleCategoryFilter);
    
    // Items per page
    document.getElementById('items-per-page').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        displayProducts();
    });
    
    // Sort icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.addEventListener('click', handleSort);
    });
    
    // Table row actions (Event delegation)
    document.getElementById('products-tbody').addEventListener('click', handleTableActions);
    
    // Edit from detail modal
    document.getElementById('btn-edit-from-detail').addEventListener('click', () => {
        const productId = parseInt(document.getElementById('btn-edit-from-detail').dataset.productId);
        detailModal.hide();
        openEditProductModal(productId);
    });
    
    // Modal events
    document.getElementById('product-modal').addEventListener('hidden.bs.modal', () => {
        UI.resetForm();
    });
}

// ===== Modal Functions =====

function openAddProductModal() {
    UI.resetForm();
    document.getElementById('modal-title').textContent = 'Thêm sản phẩm mới';
    document.getElementById('submit-text').textContent = 'Thêm sản phẩm';
    productModal.show();
}

async function openEditProductModal(productId) {
    UI.showLoading();
    const result = await API.getProductById(productId);
    
    if (result.success) {
        UI.hideLoading();
        UI.populateForm(result.data);
        productModal.show();
    } else {
        UI.hideLoading();
        UI.showAlert('Không thể tải thông tin sản phẩm: ' + result.error, 'danger');
    }
}

async function openDetailModal(productId) {
    const result = await API.getProductById(productId);
    
    if (result.success) {
        UI.renderProductDetail(result.data);
        detailModal.show();
    } else {
        UI.showAlert('Không thể tải thông tin sản phẩm: ' + result.error, 'danger');
    }
}

// ===== Form Handling =====

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('product-title').value.trim(),
        price: parseFloat(document.getElementById('product-price').value),
        description: document.getElementById('product-description').value.trim(),
        categoryId: parseInt(document.getElementById('product-category').value),
        images: Array.from(document.querySelectorAll('.image-input'))
            .map(input => input.value.trim())
            .filter(url => url !== ''),
    };
    
    const validation = UI.validateForm(formData);
    
    if (!validation.isValid) {
        UI.showFormErrors(validation.errors);
        return;
    }
    
    const productId = document.getElementById('product-id').value;
    
    if (productId) {
        await updateProduct(parseInt(productId), formData);
    } else {
        await createProduct(formData);
    }
}

async function createProduct(formData) {
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';
    
    const result = await API.createProduct(formData);
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span id="submit-text">Thêm sản phẩm</span>';
    
    if (result.success) {
        UI.showAlert('✅ Thêm sản phẩm thành công!', 'success');
        productModal.hide();
        await loadProducts();
    } else {
        UI.showAlert('❌ Lỗi khi thêm sản phẩm: ' + result.error, 'danger');
    }
}

async function updateProduct(productId, formData) {
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';
    
    const result = await API.updateProduct(productId, formData);
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span id="submit-text">Cập nhật</span>';
    
    if (result.success) {
        UI.showAlert('✅ Cập nhật sản phẩm thành công!', 'success');
        productModal.hide();
        await loadProducts();
    } else {
        UI.showAlert('❌ Lỗi khi cập nhật sản phẩm: ' + result.error, 'danger');
    }
}

async function deleteProduct(productId) {
    const result = await API.deleteProduct(productId);
    
    if (result.success) {
        UI.showAlert('✅ Xóa sản phẩm thành công!', 'success');
        confirmModal.hide();
        await loadProducts();
    } else {
        UI.showAlert('❌ Lỗi khi xóa sản phẩm: ' + result.error, 'danger');
        confirmModal.hide();
    }
}

function addImageInput() {
    const container = document.getElementById('images-container');
    const input = document.createElement('input');
    input.type = 'url';
    input.className = 'form-control mb-2 image-input';
    input.placeholder = 'https://example.com/image.jpg';
    container.appendChild(input);
}

// ===== Table Actions =====

function handleTableActions(e) {
    const target = e.target.closest('button');
    if (!target) return;
    
    const productId = parseInt(target.dataset.id);
    
    if (target.classList.contains('btn-view')) {
        openDetailModal(productId);
    } else if (target.classList.contains('btn-edit')) {
        openEditProductModal(productId);
    } else if (target.classList.contains('btn-delete')) {
        showDeleteConfirmation(productId);
    }
}

function showDeleteConfirmation(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('confirm-message').textContent = 
        `Bạn có chắc chắn muốn xóa sản phẩm "${product.title}"?`;
    
    confirmModal.show();
    
    // Setup confirm button
    const confirmBtn = document.getElementById('confirm-delete');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => deleteProduct(productId));
}

// ===== Search & Filter =====

async function handleSearch(e) {
    const searchTerm = e.target.value.trim();
    
    if (searchTerm === '') {
        // Nếu không có từ khóa tìm kiếm, hiển thị tất cả sản phẩm
        filteredProducts = allProducts;
    } else {
        // Gọi API để tìm kiếm theo title (theo đúng hướng dẫn Platzi API)
        UI.showLoading();
        const result = await API.searchProducts(searchTerm);
        UI.hideLoading();
        
        if (result.success) {
            filteredProducts = result.data;
        } else {
            UI.showAlert('Lỗi khi tìm kiếm: ' + result.error, 'danger');
            filteredProducts = [];
        }
    }
    
    // Apply category filter if active
    const categoryFilter = document.getElementById('category-filter').value;
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(p => 
            p.category?.id === parseInt(categoryFilter)
        );
    }
    
    applyFiltersAndSort();
}

function handleCategoryFilter(e) {
    const categoryId = e.target.value;
    
    if (categoryId === '') {
        filteredProducts = allProducts;
    } else {
        filteredProducts = allProducts.filter(product => 
            product.category?.id === parseInt(categoryId)
        );
    }
    
    // Apply search if active
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }
    
    applyFiltersAndSort();
}

// ===== Sorting =====

function handleSort(e) {
    const field = e.target.dataset.sort;
    
    // Toggle sort direction
    if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDirection = 'asc';
    }
    
    // Update UI
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.classList.remove('active', 'bi-sort-down', 'bi-sort-up');
        icon.classList.add('bi-arrow-down-up');
    });
    
    e.target.classList.add('active');
    e.target.classList.remove('bi-arrow-down-up');
    e.target.classList.add(sortDirection === 'asc' ? 'bi-sort-down' : 'bi-sort-up');
    
    applyFiltersAndSort();
}
