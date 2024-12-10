import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Modal, Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';

import { Picker } from '@react-native-picker/picker'; // Thêm import Picker
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";

const SignupScreen = ({ navigation }) => {
    const [photo, setPhoto] = useState(null);
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState(new Date());
    const [modalVisibility, setModalVisibility] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [isSignupSuccess, setIsSignupSuccess] = useState(false); // Thêm biến này

    const handleImagePicker = async () => {
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    setImageUri(URL.createObjectURL(file)); // Để hiển thị ảnh trên web
                    setPhoto(file); // Để upload lên server
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

    const formattedBirthday = new Date(birthday).toISOString().split('T')[0];
    const handleSignup = async () => {
        if (!username || !password || !photo || !email || !birthday) {
            setErrorMessage('Vui lòng nhập đầy đủ thông tin');
            setIsSignupSuccess(false);  // đăng ký không thành công
            setModalVisibility(true);
            return;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('email', email);
        formData.append('birthday', formattedBirthday);
        if (Platform.OS === 'web') {
            formData.append('avatar', photo);
        } else {
            formData.append('avatar', photo);
        }
        console.log('Photo data:', photo);

        try {
            const response = await axios.post('http://localhost:3000/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 200) {
                setErrorMessage('Đăng ký thành công');
                setIsSignupSuccess(true); // Đăng ký thành công
                setModalVisibility(true);
            } else {
                setErrorMessage('Đăng ký thất bại: ' + response.data.message);
                setIsSignupSuccess(false); // Đăng ký ko thành công
                setModalVisibility(true);
            }
        } catch (e) {
            console.error('Lỗi: ', e);
            setErrorMessage('Đã xảy ra lỗi trong quá trình đăng ký.');
            setIsSignupSuccess(false); // Đăng ký không thành công
            setModalVisibility(true);
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.header}>Đăng Ký</Text>
            <TouchableOpacity onPress={handleImagePicker} style={styles.photoButton}>
                {imageUri ? (<Image source={{ uri: imageUri }} style={styles.photo} />) :
                    (<Text>Chọn ảnh của bạn</Text>)}
            </TouchableOpacity>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Tài khoản</Text>
                <TextInput
                    placeholder="Username"
                    style={styles.input2}
                    value={username}
                    onChangeText={setUserName}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput

                    placeholder="Mật khẩu"
                    style={styles.input2}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    placeholder="Email"
                    style={styles.input2}

                    value={email}
                    onChangeText={setEmail}
                />

            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Birthday</Text>
                <DatePicker
                    selected={birthday}
                    onChange={setBirthday}
                    dateFormat={"dd/MM/yyyy"}
                    customInput={<TextInput style={styles.input2} />}
                />

            </View>
            <TouchableOpacity style={styles.button} onPress={handleSignup}>
                <Text style={styles.buttonText}>Đăng Ký</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisibility}
                onRequestClose={() => setModalVisibility(false)}

            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>THÔNG BÁO</Text>
                        <Text style={styles.modalMessage}>{errorMessage || "Đăng ký thành công"}</Text>
                        <View style={styles.modalButtons}>

                            <TouchableOpacity style={styles.modalButton} onPress={() => {
                                setModalVisibility(false);
                                if (isSignupSuccess) { // Chỉ điều hướng khi đăng ký thành công
                                    navigation.navigate('Login');
                                }
                            }}>
                                <Text style={styles.modalButtonText2}>Đồng ý</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', marginLeft: '10%' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginLeft: '30%' },
    input: { width: '80%', padding: 10, marginVertical: 10, borderWidth: 1, borderRadius: 5 },
    button: { backgroundColor: 'blue', padding: 15, borderRadius: 5, width: 100, alignItems: 'center', marginLeft: '30%' },
    buttonText: { color: 'white' },
    link: { color: 'blue', marginTop: 50 },
    photoButton: { alignItems: 'center', justifyContent: 'center', width: 150, height: 150, backgroundColor: '#e0e0e0', borderRadius: 75, marginBottom: 20, marginLeft: '10%' },
    photo: { width: 150, height: 150, borderRadius: 75 },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',

    }, modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        marginTop: 20,
    },
    modalButtonText2: {
        padding: 10,
        backgroundColor: 'green',
        borderRadius: 5,
        color: '#fff',


    },
    modalButtonText: {
        padding: 10,
        marginHorizontal: 10,
        backgroundColor: 'red',
        borderRadius: 5,
        color: '#fff',
    }, inputContainer: {

        width: '80%',
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

export default SignupScreen;