// pages/Books/Edit.js - 编辑图书页面（管理员）

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookById, updateBook } from '../../api/books';
import '../../style/Books.css';

const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookData, setBookData] = useState({ title: '', author: '', retail_price: 0, publisher: '' });

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await getBookById(id);
        setBookData(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBook();
  }, [id]);

  const handleChange = (e) => {
    setBookData({ ...bookData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBook(id, bookData);
      alert('Book updated successfully');
      navigate('/books');
    } catch (error) {
      console.error(error);
      alert('Failed to update book');
    }
  };

  return (
    <div className="edit-book-container">
      <div className="edit-book-header">
        <h1>编辑图书信息</h1>
        <button onClick={() => navigate('/books')} className="back-button">
          返回图书列表
        </button>
      </div>

      <form onSubmit={handleSubmit} className="edit-book-form">
        <div className="form-group">
          <label className="form-label">书名</label>
          <input
            type="text"
            name="title"
            value={bookData.title}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">作者</label>
          <input
            type="text"
            name="author"
            value={bookData.author}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">零售价</label>
          <input
            type="number"
            name="retail_price"
            value={bookData.retail_price}
            onChange={handleChange}
            required
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label className="form-label">出版社</label>
          <input
            type="text"
            name="publisher"
            value={bookData.publisher}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <button type="submit" className="submit-button">
          更新图书信息
        </button>
      </form>
    </div>
  );
};

export default EditBook;