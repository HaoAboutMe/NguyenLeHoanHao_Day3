/**
 * UI Module - Xử lý tất cả các thao tác render UI với Bootstrap
 */

/**
 * Hiển thị loading state
 */
export function showLoading() {
    document.getElementById('loading').classList.remove('d-none');
    document.getElementById('products-table').classList.add('d-none');
    document.getElementById('error-container').classList.add('d-none');
}

/**
 * Ẩn loading state
 */
export function hideLoading() {
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('products-table').classList.remove('d-none');
}

/**
 * Hiển thị thông báo (alert)
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo: success, danger, warning, info
 */
export function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'danger' ? 'x-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    alertDiv.innerHTML = `
        <i class="bi bi-${icon}"></i>
        <strong>${message}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto remove sau 5 giây
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

/**
 * Hiển thị error state
 * @param {string} message - Thông báo lỗi
 */
export function showError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `
        <h4><i class="bi bi-exclamation-triangle"></i> Có lỗi xảy ra</h4>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise"></i> Tải lại trang
        </button>
    `;
    errorContainer.classList.remove('d-none');
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('products-table').classList.add('d-none');
}

/**
 * Lấy URL ảnh sản phẩm hoặc placeholder
 */
function getProductImage(images) {
    if (images && images.length > 0 && images[0]) {
        const imageUrl = images[0].trim();
        if (imageUrl) return imageUrl;
    }
    return 'https://via.placeholder.com/60/6366f1/ffffff?text=No+Image';
}

/**
 * Render danh sách sản phẩm vào bảng
 * @param {Array} products - Mảng sản phẩm
 */
export function renderProducts(products) {
    const tbody = document.getElementById('products-tbody');
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="mt-2 text-muted">Không có sản phẩm nào</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => {
        const imageUrl = getProductImage(product.images);
        const description = escapeHtml(product.description || '');
        
        return `
        <tr data-product-id="${product.id}" data-description="${description}" class="product-row">
            <td>${product.id}</td>
            <td>
                <div class="product-title">${escapeHtml(product.title)}</div>
            </td>
            <td>
                <span class="product-price">$${product.price}</span>
            </td>
            <td>
                <span class="product-category">${product.category?.name || 'N/A'}</span>
            </td>
            <td>
                <img src="${imageUrl}" 
                     alt="${escapeHtml(product.title)}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/60/6366f1/ffffff?text=Error'">
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info btn-view" data-id="${product.id}" title="Xem chi tiết">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning btn-edit" data-id="${product.id}" title="Sửa">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-delete" data-id="${product.id}" title="Xóa">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
    
    // Create tooltip element (only once)
    let tooltip = document.getElementById('product-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'product-tooltip';
        tooltip.className = 'product-description-tooltip';
        document.body.appendChild(tooltip);
    }
    
    // Add hover effect to show description tooltip
    document.querySelectorAll('.product-row').forEach(row => {
        row.addEventListener('mouseenter', function(e) {
            const description = this.dataset.description;
            if (description && description.trim() !== '') {
                tooltip.textContent = description;
                tooltip.style.display = 'block';
            }
        });
        
        row.addEventListener('mousemove', function(e) {
            const description = this.dataset.description;
            if (description && description.trim() !== '') {
                // Position tooltip near cursor
                const offsetX = 15;
                const offsetY = 15;
                
                // Get viewport dimensions
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Calculate tooltip position
                let left = e.pageX + offsetX;
                let top = e.pageY + offsetY;
                
                // Adjust if tooltip goes off screen
                const tooltipRect = tooltip.getBoundingClientRect();
                if (left + tooltipRect.width > viewportWidth) {
                    left = e.pageX - tooltipRect.width - offsetX;
                }
                if (top + tooltipRect.height > viewportHeight) {
                    top = e.pageY - tooltipRect.height - offsetY;
                }
                
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            }
        });
        
        row.addEventListener('mouseleave', function() {
            tooltip.style.display = 'none';
        });
    });
}

/**
 * Render chi tiết sản phẩm vào modal
 * @param {Object} product - Sản phẩm
 */
export function renderProductDetail(product) {
    const detailContent = document.getElementById('detail-content');
    
    const images = product.images && product.images.length > 0 
        ? product.images.map(img => `<img src="${img}" alt="Product" onerror="this.src='https://via.placeholder.com/100/6366f1/ffffff?text=Error'">`).join('')
        : '<p class="text-muted">Không có hình ảnh</p>';
    
    detailContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="detail-row">
                    <div class="detail-label">ID</div>
                    <div class="detail-value">${product.id}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Tên sản phẩm</div>
                    <div class="detail-value"><strong>${escapeHtml(product.title)}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Giá</div>
                    <div class="detail-value"><span class="product-price">$${product.price}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Danh mục</div>
                    <div class="detail-value">
                        <span class="product-category">${product.category?.name || 'N/A'}</span>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-row">
                    <div class="detail-label">Mô tả</div>
                    <div class="detail-value">${escapeHtml(product.description)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Hình ảnh</div>
                    <div class="detail-images">${images}</div>
                </div>
            </div>
        </div>
    `;
    
    // Store product ID for edit button
    document.getElementById('btn-edit-from-detail').dataset.productId = product.id;
}

/**
 * Render danh sách categories
 */
export function renderCategories(categories) {
    const categoryFilter = document.getElementById('category-filter');
    const productCategory = document.getElementById('product-category');
    
    categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>' +
        categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
    
    productCategory.innerHTML = '<option value="">Chọn danh mục</option>' +
        categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
}

/**
 * Reset form
 */
export function resetForm() {
    const form = document.getElementById('product-form');
    form.reset();
    form.classList.remove('was-validated');
    
    // Clear validation errors
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    
    // Reset images container
    document.getElementById('images-container').innerHTML = 
        '<input type="url" class="form-control mb-2 image-input" placeholder="https://example.com/image.jpg">';
    
    document.getElementById('product-id').value = '';
}

/**
 * Populate form với dữ liệu sản phẩm
 */
export function populateForm(product) {
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-title').value = product.title;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-category').value = product.category?.id || '';
    
    // Populate images
    const imagesContainer = document.getElementById('images-container');
    if (product.images && product.images.length > 0) {
        imagesContainer.innerHTML = product.images
            .map(url => `<input type="url" class="form-control mb-2 image-input" value="${url}" placeholder="https://example.com/image.jpg">`)
            .join('');
    }
    
    document.getElementById('modal-title').textContent = 'Cập nhật sản phẩm';
    document.getElementById('submit-text').textContent = 'Cập nhật';
}

/**
 * Validate form
 */
export function validateForm(formData) {
    const errors = {};
    let isValid = true;
    
    if (!formData.title || formData.title.trim().length < 3) {
        errors.title = 'Tên sản phẩm phải có ít nhất 3 ký tự';
        isValid = false;
    }
    
    if (!formData.price || formData.price <= 0) {
        errors.price = 'Giá phải lớn hơn 0';
        isValid = false;
    }
    
    if (!formData.description || formData.description.trim().length < 10) {
        errors.description = 'Mô tả phải có ít nhất 10 ký tự';
        isValid = false;
    }
    
    if (!formData.categoryId) {
        errors.category = 'Vui lòng chọn danh mục';
        isValid = false;
    }
    
    if (!formData.images || formData.images.length === 0 || !formData.images[0]) {
        errors.images = 'Vui lòng nhập ít nhất 1 URL hình ảnh';
        isValid = false;
    }
    
    return { isValid, errors };
}

/**
 * Hiển thị lỗi validation
 */
export function showFormErrors(errors) {
    // Clear previous errors
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    
    // Show new errors
    Object.keys(errors).forEach(key => {
        const inputId = key === 'category' ? 'product-category' : `product-${key}`;
        const input = document.getElementById(inputId);
        const errorElement = document.getElementById(`error-${key}`);
        
        if (input) input.classList.add('is-invalid');
        if (errorElement) errorElement.textContent = errors[key];
    });
}

/**
 * Render pagination
 */
export function renderPagination(currentPage, totalPages, onPageChange) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
        if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }
    
    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    pagination.innerHTML = html;
    
    // Add event listeners
    pagination.querySelectorAll('a.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.currentTarget.dataset.page);
            if (page && page !== currentPage && page >= 1 && page <= totalPages) {
                onPageChange(page);
            }
        });
    });
}

/**
 * Export data to CSV
 * @param {Array} products - Mảng sản phẩm
 * @param {string} filename - Tên file
 */
export function exportToCSV(products, filename = 'products.csv') {
    if (!products || products.length === 0) {
        showAlert('Không có dữ liệu để export', 'warning');
        return;
    }
    
    // CSV headers
    const headers = ['ID', 'Title', 'Price', 'Category', 'Description', 'Images'];
    
    // CSV rows
    const rows = products.map(product => [
        product.id,
        `"${(product.title || '').replace(/"/g, '""')}"`,
        product.price,
        `"${(product.category?.name || 'N/A').replace(/"/g, '""')}"`,
        `"${(product.description || '').replace(/"/g, '""')}"`,
        `"${(product.images || []).join('; ')}"`
    ]);
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Export CSV thành công!', 'success');
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
