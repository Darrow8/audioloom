import LoginButton from '@/components/LoginButton';
import React from 'react'
import { View, Text, StyleSheet, Image, Button } from 'react-native';

const Landing = () => {

    return (
            <View style={styles.container}>
                <Image
                    source={require("../assets/images/walk2.png")}
                    style={styles.heroImage}
                />
                <Text style={styles.title}>Rivet Audio</Text>
                <Text style={styles.subtitle}>Listen to your readings as you walk to class</Text>
                <LoginButton />
            </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        marginTop: -100,
    },
    heroImage: {
        width: '100%',
        height: '40%',
        resizeMode: 'contain',
        marginBottom: 10,
        marginTop: -50,
    },
    title: {
        fontSize: 50,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        fontFamily: 'FuturaMediumBold',
    },
    subtitle: {
        fontSize: 25,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'FuturaBook',

    }
});
export default Landing;