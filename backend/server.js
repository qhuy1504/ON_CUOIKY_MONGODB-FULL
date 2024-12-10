const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối MongoDB với tên database react
mongoose.connect('mongodb://localhost:27017/react', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Connection error', err));

// Định nghĩa mô hình User

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, sparse: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    birthday: { type: Date, required: true },
    avatar: { type: String, default: 'default.png' }
}, { versionKey: false });

// Định nghĩa mô hình User với collection tên là 'react_db'
const User = mongoose.model('User', userSchema, 'react_db');



// Setup đường dẫn upfile
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Lấy danh sách người dùng
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.get('/users/:_id', async (req, res) => {
    const { _id } = req.params; // Lấy _id từ đường dẫn
    console.log('_id:', _id); // Kiểm tra _id

    // Kiểm tra _id hợp lệ
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    try {
        // Tìm kiếm user theo _id
        const user = await User.findById(_id);

        if (!user) {
            // Nếu không tìm thấy user với _id
            return res.status(404).json({ message: 'User không tồn tại.' });
        }

        // Trả về thông tin user
        res.status(200).json(user);
    } catch (err) {
        console.error('Lỗi khi lấy thông tin user:', err);
        res.status(500).json({ message: 'Lỗi server. Không thể lấy thông tin user.' });
    }
});


// Đăng ký người dùng mới
// const { v4: uuidv4 } = require('uuid');
app.post('/register', upload.single('avatar'), async (req, res) => {
    const { username, password, email, birthday } = req.body;
    const avatar = req.file ? req.file.filename : 'default.png';
    // const id = uuidv4(); // Tạo id duy nhất

    try {
        // Kiểm tra tài khoản đã tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.json({ success: false, message: 'Tài khoản đã tồn tại' });
        }

        // Tạo người dùng mới
        const newUser = new User({ username, password, avatar, email, birthday });
        await newUser.save();
        res.json({ success: true, message: 'Đã thêm người dùng' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Đăng nhập
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username, password });
        if (user) {
            res.json({ success: true, message: 'Đăng nhập thành công', user });
        } else {
            res.json({ success: false, message: 'Tài khoản hoặc mật khẩu sai' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Đổi mật khẩu
app.put('/reset-password', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        user.password = password;
        await user.save();
        res.json({ success: true, message: 'Đã cập nhật mật khẩu' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Xóa tài khoản
app.delete('/delete-account', async (req, res) => {
    const { username } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        await user.deleteOne();
        res.json({ success: true, message: 'Đã xóa tài khoản' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Xóa user theo id

app.delete('/users/:_id', async (req, res) => {
    const { _id } = req.params; // lấy từ đường dẫn
    console.log('_id:', _id); // Kiểm tra _id

    // Kiểm tra _id hợp lệ
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    try {
        // Tạo ObjectId từ _id
        const objectId = new mongoose.Types.ObjectId(_id);
        // Tìm và xóa user theo _id
        const result = await User.deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            // Nếu không có document nào bị xóa, nghĩa là user không tồn tại
            return res.status(404).json({ message: 'User không tồn tại.' });
        }

        // Trả về thông báo thành công
        res.status(200).json({ message: 'Xóa user thành công.' });
    } catch (err) {
        console.error('Lỗi khi xóa user:', err);
        res.status(500).json({ message: 'Lỗi server. Không thể xóa user.' });
    }
});

// sửa user theo id

app.put('/users/:userId', upload.single('avatar'), async (req, res) => {
    const userId = req.params.userId; // Lấy userId từ URL
    const { password, email, birthday } = req.body;   // Lấy mật khẩu mới từ body
    const avatar = req.file ? req.file.filename : null; // Lấy tên file avatar nếu có

    console.log('req.params.userId:', req.params.userId);
    console.log('password:', req.body);
    console.log('req.file:', req.file);

    try {
        // Tìm người dùng trong MongoDB theo userId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        // Cập nhật thông tin nếu có thay đổi
        if (password) {
            user.password = password; // Cập nhật mật khẩu
        }
        if (email) {
            user.email = email; // Cập nhật email
        }
        if (birthday) {
            user.birthday = birthday; // Cập nhật birthDay
        }

        if (avatar) {
            user.avatar = avatar; // Cập nhật avatar
        }

        // Lưu người dùng đã cập nhật
        await user.save();

        res.json({ success: true, message: 'Thông tin người dùng đã được cập nhật' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật dữ liệu' });
    }
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});