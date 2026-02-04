/**
 * API Module - Xử lý tất cả các request đến REST API
 * Base URL: https://api.escuelajs.co/api/v1
 */

const API_BASE_URL = 'https://api.escuelajs.co/api/v1';

/**
 * Generic fetch wrapper với error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} - Response data
 */
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        // Kiểm tra response status
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * GET - Lấy danh sách tất cả sản phẩm
 * @param {number} limit - Số lượng sản phẩm (optional)
 * @param {number} offset - Vị trí bắt đầu (optional)
 * @returns {Promise} - Danh sách sản phẩm
 */
export async function getAllProducts(limit = 50, offset = 0) {
    return await fetchAPI(`/products?limit=${limit}&offset=${offset}`);
}

/**
 * GET - Lấy thông tin một sản phẩm theo ID
 * @param {number} id - Product ID
 * @returns {Promise} - Thông tin sản phẩm
 */
export async function getProductById(id) {
    return await fetchAPI(`/products/${id}`);
}

/**
 * POST - Tạo sản phẩm mới
 * @param {object} productData - Dữ liệu sản phẩm
 * @returns {Promise} - Sản phẩm vừa tạo
 */
export async function createProduct(productData) {
    return await fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
    });
}

/**
 * PUT - Cập nhật sản phẩm
 * @param {number} id - Product ID
 * @param {object} productData - Dữ liệu cần cập nhật
 * @returns {Promise} - Sản phẩm đã cập nhật
 */
export async function updateProduct(id, productData) {
    return await fetchAPI(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
    });
}

/**
 * DELETE - Xóa sản phẩm
 * @param {number} id - Product ID
 * @returns {Promise} - Kết quả xóa
 */
export async function deleteProduct(id) {
    return await fetchAPI(`/products/${id}`, {
        method: 'DELETE',
    });
}

/**
 * GET - Lấy danh sách tất cả categories
 * @returns {Promise} - Danh sách categories
 */
export async function getAllCategories() {
    return await fetchAPI('/categories');
}

/**
 * GET - Lọc sản phẩm theo category
 * @param {number} categoryId - Category ID
 * @returns {Promise} - Danh sách sản phẩm theo category
 */
export async function getProductsByCategory(categoryId) {
    return await fetchAPI(`/categories/${categoryId}/products`);
}

/**
 * GET - Tìm kiếm sản phẩm theo title
 * @param {string} title - Tên sản phẩm cần tìm
 * @returns {Promise} - Danh sách sản phẩm tìm được
 */
export async function searchProducts(title) {
    return await fetchAPI(`/products/?title=${encodeURIComponent(title)}`);
}
