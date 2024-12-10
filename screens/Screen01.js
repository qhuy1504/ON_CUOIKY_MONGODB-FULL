import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Modal, TextInput, Platform } from "react-native";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
// npm install expo-image-picker react-native-image-picker
import { launchImageLibrary } from 'react-native-image-picker';


import { Picker } from '@react-native-picker/picker'; // Thêm import Picker
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";

const Screen01 = ({ route, navigation }) => {
    const [users, setUsers] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false); // State để điều khiển hiển thị Modal

    const [userIdToEdit, setUserIdToEdit] = useState(null); // Lưu trữ ID người dùng cần sửa
    const [userIdToDelete, setUserIdToDelete] = useState(null); // Lưu trữ ID người dùng cần xóa
    const [isModalVisible1, setIsModalVisible1] = useState(false); // State để điều khiển hiển thị Modal

    const [newPassword, setNewPassword] = useState(""); // Lưu mật khẩu mới
    const [newEmail, setNewEmail] = useState(""); // Lưu email mới
    const [newBirthday, setNewBirthday] = useState(new Date()); // Lưu email mới
    const [newAvatar, setNewAvatar] = useState(null); // Lưu ảnh đại diện mới

    const { user } = route.params || { username: "Guest", avatar: null };
    const [imageUri, setImageUri] = useState(null);
    const [triggerUpdate, setTriggerUpdate] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    

    useEffect(() => {
        if (user.username === "admin") {
            // Giả sử API endpoint là "/api/users"
            axios.get("http://localhost:3000/users")
                .then(response => setUsers(response.data))
                .catch(error => console.error("Lỗi khi tải danh sách user:", error));
        }
    }, [user.username, triggerUpdate]);

    //SỬA FULL THÔNG TIN

    const fetchUserInfo = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:3000/users/${userId}`);
            console.log('User info:', response.data);
            const userData = response.data; // Giả sử API trả về dữ liệu người dùng

            // Cập nhật các state với thông tin người dùng
            setNewEmail(userData.email);
            setNewPassword(userData.password);
            setNewBirthday(new Date(userData.birthday));
            setImageUri(userData.avatar ? `http://localhost:3000/uploads/${userData.avatar}` : null); // Cập nhật ảnh đại diện
        } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            alert('Không thể tải thông tin người dùng');
        }
    };

 

    const handleDeleteUser = (userId) => {
        // Hiển thị Modal xác nhận xóa
        setUserIdToDelete(userId);
        console.log("userId:", userId);
        setIsModalVisible(true);
        
    };

    const deleteUser = () => {
        // API endpoint để xóa user
        axios.delete(`http://localhost:3000/users/${userIdToDelete}`) 
            .then(() => {
                setUsers(users.filter(user => user._id !== userIdToDelete)); // Cập nhật danh sách user
                setIsModalVisible(false); // Đóng Modal sau khi xóa thành công
                alert("Thành công", "Đã xóa user.");
            })
            .catch(error => console.error("Lỗi khi xóa user:", error)); // Log lỗi nếu xảy ra
        console.log("userIdToDelete:", userIdToDelete);
    };

    const cancelDelete = () => {
        setIsModalVisible(false); // Đóng Modal khi hủy
    };

    const handleEditUser = (userId) => {
        // Xử lý mở Modal sửa user
        setUserIdToEdit(userId);
        setIsModalVisible1(true); // Mở Modal
        // Gọi API để lấy thông tin người dùng
        fetchUserInfo(userId);
    };
    const cancelEdit = () => {
        setIsModalVisible1(false); // Đóng Modal khi hủy
    };


    const handleImagePicker = async () => {
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    setImageUri(URL.createObjectURL(file)); // Để hiển thị ảnh trên web
                    setNewAvatar(file); // Để upload lên server
                }
            };
            input.click();
        } else {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
                setImageFile({
                    uri: result.assets[0].uri,
                    type: 'image/png', // type của ảnh
                    name: 'avatar.png', // tên file
                });
            }
        }
    };

    const handleSaveChanges = async () => {
        if (!newPassword && !newAvatar) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        const formData = new FormData();
        formData.append('password', newPassword); // Nếu muốn cập nhật mật khẩu
        formData.append('email', newEmail);
        const localDate = newBirthday.toLocaleDateString('en-CA');
        formData.append('birthday', localDate);
        if (Platform.OS === 'web') {
            formData.append('avatar', newAvatar);
        } else {
            formData.append('avatar', newAvatar);
        }
        console.log('newAvatar:', newAvatar);

        try {
            const response = await axios.put(`http://localhost:3000/users/${userIdToEdit}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('User updated:', response.data);
            alert('Đã lưu thay đổi!');
            // Kích hoạt lại useEffect để tải danh sách mới
            setTriggerUpdate(prev => !prev);
            setIsModalVisible1(false); // Mở Modal
            // Đặt lại các state sau khi cập nhật xong
            setNewPassword('');
            setNewAvatar(null);
            setImageUri(null); // Reset hiển thị ảnh
        } catch (error) {
            console.error('Lỗi khi cập nhật user:', error.response?.data || error.message);
        }
    };
    //Hàm lọc danh sách người dùng
    const filterUser = () => {
        return users.filter((item) => item.username.toLowerCase().includes(searchQuery.toLowerCase()));
    }


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.gioiThieu}>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile', { user })}>
                        <Image
                            source={user.avatar ? { uri: `http://localhost:3000/uploads/${user.avatar}` } : require('../img/personicon.png')}
                            style={styles.imgProfile}
                        />
                    </TouchableOpacity>
                    <View style={styles.title}>
                        <Text style={styles.title1}>Welcome!</Text>
                        <Text style={styles.title2}>{user.username}</Text>
                    </View>
                </View>
                
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Search</Text>
                <TextInput
                    style={styles.input2}
                    placeholder="Tìm kiếm theo username"
                    value={searchQuery}
                    onChangeText={setSearchQuery}

                />

            </View>
            
            
            {user.username === "admin" ? (
                <FlatList
                    data={filterUser().filter((item) => item.username !== "admin")}
                    keyExtractor={(item) => item._id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.userItem}>
                            <Image source={{ uri: `http://localhost:3000/uploads/${item.avatar}` }} style={styles.userAvatar} />
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{item.username}</Text>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => handleEditUser(item._id)} style={styles.editButton}>
                                    <Text style={styles.actionText}>Sửa</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteUser(item._id)} style={styles.deleteButton}>
                                    <Text style={styles.actionText}>Xóa</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            ) : (
                <Text style={styles.message}>Bạn không có quyền truy cập danh sách user.</Text>
            )}

            {/* Modal xác nhận xóa */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={isModalVisible}
                onRequestClose={cancelDelete}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Xác nhận</Text>
                        <Text style={styles.modalMessage}>Bạn có chắc chắn muốn xóa user này không?</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={cancelDelete} style={styles.cancelButton}>
                                <Text style={styles.buttonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={deleteUser} style={styles.confirmButton}>
                                <Text style={styles.buttonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
             {/* Modal sửa thông tin user */}
            {/* Modal sửa thông tin user */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={isModalVisible1}
                onRequestClose={cancelEdit}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Sửa thông tin người dùng</Text>



                        {/* Nhập mật khẩu mới */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Mật khẩu</Text>
                            <TextInput
                                placeholder="Mật khẩu mới"

                                value={newPassword}
                                onChangeText={setNewPassword}
                                style={styles.input}
                            />
                        </View>

                        {/* Nhập email mới */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                placeholder="Email"
                                value={newEmail}
                                onChangeText={setNewEmail}
                                style={styles.input}
                            />
                        </View>


                        {/* Chọn ảnh đại diện */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Ảnh đại diện</Text>


                            <TouchableOpacity onPress={handleImagePicker} style={styles.photoButton}>
                                {imageUri ? (<Image source={{ uri: imageUri }} style={styles.newAvatar} />) :
                                    (<Text>Chọn ảnh của bạn</Text>)}
                            </TouchableOpacity>
                        </View>

                        {/* Nhập ngày sinh mới */}


                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Ngày sinh</Text>

                            <DatePicker
                                selected={newBirthday}
                                onChange={setNewBirthday}
                                dateFormat={"dd/MM/yyyy"}
                                customInput={<TextInput style={styles.input2} />}
                            />
                        </View>


                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={cancelEdit} style={styles.cancelButton}>
                                <Text style={styles.buttonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveChanges} style={styles.confirmButton}>
                                <Text style={styles.buttonText}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#6426ff',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    gioiThieu: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imgProfile: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    title: {
        marginLeft: 10,
    },
    title1: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    title2: {
        color: 'white',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    userInfo: {
        flex: 1,
        marginLeft: 10,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
    },
    editButton: {
        backgroundColor: '#4caf50',
        padding: 5,
        borderRadius: 5,
        marginRight: 5,
    },
    deleteButton: {
        backgroundColor: '#f44336',
        padding: 5,
        borderRadius: 5,
    },
    actionText: {
        color: 'white',
        fontSize: 12,
    },
    message: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: 500,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalMessage: {
        marginVertical: 20,
        fontSize: 16,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    cancelButton: {
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 5,
    },
    confirmButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    buttonChonAnh: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    input: {
        marginTop: 10,
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
    }, photoButton: { alignItems: 'center', justifyContent: 'center', width: 150, height: 150, backgroundColor: '#e0e0e0', borderRadius: 10, marginBottom: 20 },
    newAvatar: { width: 150, height: 150, borderRadius: 10 },
    inputContainer: {
        marginVertical: 10,
    }, label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    input2: {
        height: 40,
        backgroundColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 5,
    }
});

export default Screen01;