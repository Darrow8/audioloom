import AuthButtons from '@/components/AuthButtons';
import { Colors } from '@/constants/Colors';
import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native';

const Landing = () => {

    return (
        <View style={styles.container}>
            <Image
                source={require("../assets/images/walk2.png")}
                style={styles.heroImage}
            />
            <Text style={styles.title}>Audioloom</Text>
            <Text style={styles.subtitle}>Finish your readings as you walk to class</Text>
            <AuthButtons />
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
        backgroundColor: Colors.theme.background,
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
        // fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        color: Colors.theme.darkText,
        fontFamily: 'NotoSans',
    },
    subtitle: {
        fontSize: 25,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'NotoSans',
        color: Colors.theme.darkText,

    }
});
export default Landing;