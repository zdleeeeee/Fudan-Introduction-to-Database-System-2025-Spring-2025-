// books.js - 图书接口（搜索、添加、更新等）
import api from './api';

// 查看所有书籍
export const getBooks = () => api.get('/books');

// 添加书籍
export const addBook = (bookData) => api.post('/books', bookData);

// 用书名查找
export const searchBooks = (keyword) => api.get('/books/search', { params: { keyword } });

// 更新书籍信息
export const updateBook = (bk_id, bookData) => api.put(`/books/${bk_id}`, bookData);

// 用id查找书籍信息
export const getBookById = (bk_id) => api.get(`/books/${bk_id}`);

// 用ISBN查找书籍
export const getBookByISBN = (isbn) => api.get(`/books/isbn/${isbn}`);

// 用作者查找书籍
export const getBookByAuthor = (author) => api.get(`/books/author/${author}`);

// 用出版社查找书籍
export const getBookByPublisher = (publisher) => api.get(`/books/publisher/${publisher}`);