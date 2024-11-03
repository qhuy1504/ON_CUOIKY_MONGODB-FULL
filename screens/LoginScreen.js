import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';


const LoginScreen = ({ navigation }) => {
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [dataUser, setDataUser] = useState([]);

    const handleLogin = async () => {
        // Thêm logic đăng nhập ở đây
        try {
            const response = await axios.post('http://192.168.2.144:3000/login', {
                username,
                password
            });
        
            console.log('Đăng nhập:', username, password);
            //Ktra phản hồi
            if (response.status === 200 && response.data.success) {
                navigation.navigate('Screen01', { user: response.data.user});
            } else {
                alert('Đăng nhập thất bại: ' + response.data.message);
        
            }
        } catch (error) {
            console.error('Lỗi: ', error);
            alert('Đã xảy ra lỗi trong quá trình đăng nhập.');
        }
    };
  
 
        

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Đăng Nhập</Text>
            <TextInput
                placeholder="Username"
                style={styles.input}
                value={username}
                onChangeText={setUserName}
            />
            <TextInput
                placeholder="Mật khẩu"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Đăng Nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.link}>Chưa có tài khoản? Đăng ký</Text>
            </TouchableOpacity>
          
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F9F9F9',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 15,
        marginVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FFF',
        fontSize: 16,
    },
    button: {
        width: '100%',
        padding: 15,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    link: {
        fontSize: 14,
        color: '#007AFF',
        marginTop: 10,
        textDecorationLine: 'underline',
    },
});


export default LoginScreen;
