import React, { useEffect, useState } from 'react';
import { getBooks, searchBooks, getBookById, getBookByISBN, getBookByAuthor, getBookByPublisher } from '../../api/books';
import { useNavigate } from 'react-router-dom';
import BookCard from '../../components/BookCard';
import '../../style/Books.css';

const BooksList = ({ user }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('title'); // 新增：搜索类型，默认是书名
  const navigate = useNavigate();

  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  // 获取图书数据
  const fetchBooks = async () => {
    try {
      setLoading(true);
      let response;
      if (searchKeyword) {
        switch (searchType) {
          case 'id':
            const id = parseInt(searchKeyword, 10);
            if (!isNaN(id)) {
              try {
                response = await getBookById(id);
                setBooks([response.data]);
              } catch (error) {
                if (error.response?.status === 404) {
                  setBooks([]);
                  setError('未找到该ID的图书');
                } else {
                  throw error;
                }
              }
            }
            break;
          case 'isbn':
            response = await getBookByISBN(searchKeyword);
            setBooks(response.data);
            break;
          case 'author':
            response = await getBookByAuthor(searchKeyword);
            setBooks(response.data);
            break;
          case 'publisher':
            response = await getBookByPublisher(searchKeyword);
            setBooks(response.data);
            break;
          default: // 默认为按标题搜索
            response = await searchBooks(searchKeyword);
            setBooks(response.data);
        }
      } else {
        response = await getBooks();
        setBooks(response.data);
      }
    } catch (error) {
      console.error('获取图书失败:', error);
      setError(error.response?.data?.message || '加载图书失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearch = () => {
    fetchBooks();
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSearchType('title'); // 重置为默认搜索类型
    fetchBooks();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchKeyword(''); // 切换搜索类型时清空输入
  }

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div className="books-container">
      <div className="books-header">
        <h1 className="page-title">图书列表</h1>
        <div className="action-buttons">
          <button onClick={() => navigate('/')} className="back-button">
            返回主页
          </button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="filter-select">
            <option value="title">按书名</option>
            <option value="id">按ID</option>
            <option value="isbn">按ISBN</option>
            <option value="author">按作者</option>
            <option value="publisher">按出版社</option>
          </select>
          <input
            type="text"
            placeholder={`输入${searchType === 'id' ? 'ID' : searchType}搜索`}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            搜索
          </button>
          <button onClick={handleReset} className="reset-button">
            显示全部
          </button>
        </div>
      </div>

      <div className="books-grid">
        {books.length > 0 ? (
          books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onBuy={() => navigate(`/sale/${book.id}`)}
              onEdit={() => navigate(`/books/edit/${book.id}`)}
              showEdit={isAdmin}
            />
          ))
        ) : (
          <div className="no-books-message">
            <p>没有找到图书</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BooksList;