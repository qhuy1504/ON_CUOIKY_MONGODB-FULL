// cai dat thu vien
//npm install express --save
const express = require('express');
// const bodyparser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(express.json()); // Để xử lý JSON
app.use(express.urlencoded({ extended: true })); // Để xử lý URL-encoded dữ liệu

//Setup đường dẫn upfile
// Định nghĩa nơi lưu và tên tệp ảnh
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Thư mục lưu ảnh
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Đặt tên duy nhất cho file
    }
});

const upload = multer({ storage: storage });

////Kết nối db
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3307,
    database: 'user'
});
db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL Server');
});

//select (get) lấy danh sách người dùng
app.get('/users', (req, res) => {
    db.query('select * from users', (err, kq) => {
        if (err) throw err;
        res.json(kq);
    });
});

// Xóa user theo id
app.delete('/users/:id', (req, res) => {
   
    const {id } = req.params; // lấy từ đường dẫn
    console.log('ID:', req.params);

    // Câu lệnh SQL để xóa user theo ID
    const query = 'DELETE FROM users WHERE id = ?';

    // Thực hiện truy vấn MySQL
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Lỗi khi xóa user:', err);
            res.status(500).json({ message: 'Lỗi server. Không thể xóa user.' });
        } else if (result.affectedRows === 0) {
            // Nếu không có hàng nào bị ảnh hưởng, nghĩa là user không tồn tại
            res.status(404).json({ message: 'User không tồn tại.' });
        } else {
            res.status(200).json({ message: 'Xóa user thành công.' });
        }
    });
});

// Endpoint PUT để cập nhật thông tin người dùng
app.put('/users/:userId', upload.single('avatar'), (req, res) => {
    const userId = req.params.userId; // Lấy userId từ URL
    const { password } = req.body;   // Lấy mật khẩu mới từ body
    const avatar = req.file ? req.file.filename : null; // Lấy tên file avatar nếu có
    console.log(' req.params.userId:', req.params.userId);
    console.log(' password:', req.body);
    console.log('  req.file:', req.file);

    // Kiểm tra người dùng có tồn tại không
    const sqlCheck = 'SELECT * FROM users WHERE id = ?';
    db.query(sqlCheck, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        // Tạo câu lệnh cập nhật linh hoạt
        let updateQuery = 'UPDATE users SET ';
        const updateFields = [];
        const updateValues = [];

        if (password) {
            updateFields.push('password = ?');
            updateValues.push(password);
        }
        if (avatar) {
            updateFields.push('avatar = ?');
            updateValues.push(avatar);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'Không có dữ liệu để cập nhật' });
        }

        updateQuery += updateFields.join(', ') + ' WHERE id = ?';
        updateValues.push(userId);

        // Thực hiện câu lệnh cập nhật
        db.query(updateQuery, updateValues, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật dữ liệu' });
            }
            res.json({ success: true, message: 'Thông tin người dùng đã được cập nhật' });
        });
    });
});


// insert (post)
app.post('/register', upload.single('avatar'), (req, res) =>{
    const { username, password } = req.body;
    
    const avatar = req.file ? req.file.filename : 'default.png'; 
    
    // console.log('Request body:', req.body);
    // console.log('Uploaded file:', req.file);
   
    //Kiễm trả tài khoản có tồn tại chưa
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
        if (results.length > 0) {
            return res.json({ success: false, message: 'Tài khoản đã tồn tại' });
        }
        // Nếu chưa có theem mới
        const insertquery = 'INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)';
        db.query(insertquery, [username, password, avatar], (err, kq) => {
        if (err) throw err;
        res.json({ success: true, message: 'Đã thêm người dùng' });
    });
    });
});

// kiem tra dang nhap
app.post('/login', (req, res) =>{
    const { username, password } = req.body;

    db.query('SELECT * FROM users where username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
        if (results.length > 0) {
            res.json({ success: true, message: 'Đăng nhập thành công', user: results[0] });
        } else {
            res.json({ success: false, message: 'Tài khoản hoặc mật khẩu sai' });
        }
    });
});
//Endpoint đổi mật khẩu
app.put('/reset-password', express.json(), (req, res) => {
    
    const { username, password } = req.body;
    //Kiểm tra xem user có tồn tại không
    const checkQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkQuery, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
        if (results.length === 0) {
            return res.json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        //Nếu có thì cập nhật mật khẩu
        const updateQuery = 'UPDATE users SET password = ? WHERE username = ?';
        db.query(updateQuery, [password, username], (err, kq) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Lỗi server' });
            }
            res.json({ success: true, message: 'Đã cập nhật mật khẩu' });
        });
    });

});
// Endpoint xóa tài khoản
app.delete('/delete-account', express.json(), (req, res) => {
    const { username } = req.body;
    //Kiểm tra xem user có tồn tại không
    const checkQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkQuery, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
        if (results.length === 0) {
            return res.json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        //Nếu có thì xóa
        const deleteQuery = 'DELETE FROM users WHERE username = ?';
        db.query(deleteQuery, [username], (err, kq) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Lỗi server' });
            }
            res.json({ success: true, message: 'Đã xóa tài khoản' });
        });
    });




});






app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
