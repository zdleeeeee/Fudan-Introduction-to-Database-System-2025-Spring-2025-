import React from 'react';
import '../style/Books.css';

const BookCard = ({ book, onBuy, showEdit, onEdit }) => {
  return (
    <div className="book-card">
      <div className="card-header">
        <h3 className="book-title">{book.title}</h3>
        <span className="book-id">ID: {book.id}</span>
      </div>
      
      <div className="card-body">
        <div className="book-detail">
          <span className="detail-label">ISBN:</span>
          <span className="detail-value">{book.isbn}</span>
        </div>
        <div className="book-detail">
          <span className="detail-label">作者:</span>
          <span className="detail-value">{book.author}</span>
        </div>
        <div className="book-detail">
          <span className="detail-label">出版社:</span>
          <span className="detail-value">{book.publisher}</span>
        </div>
        <div className="book-detail">
          <span className="detail-label">零售价:</span>
          <span className="detail-value">¥{book.retail_price.toFixed(2)}</span>
        </div>
        <div className="book-detail">
          <span className="detail-label">库存:</span>
          <span className="detail-value">{book.stock_quantity}</span>
        </div>
        <div className="book-detail">
          <span className="detail-label">更新时间:</span>
          <span className="detail-value">{new Date(book.updated_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="card-footer">
        <button onClick={onBuy} className="action-button buy-button">
          购买
        </button>
        
        {showEdit && (
          <button onClick={onEdit} className="action-button edit-button">
            编辑
          </button>
        )}
      </div>
    </div>
  );
};

export default BookCard;