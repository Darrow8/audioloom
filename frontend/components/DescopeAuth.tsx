import { useCallback } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
// import { AuthProvider, useFlow, useDescope, useSession } from '@descope/react-native-sdk'

export default function DescopeAuth() {
  
//   const flow = useFlow()
//   const { session, clearSession, manageSession } = useSession()
//   const { logout } = useDescope()

//   const handleLogout = useCallback(() => {
//     logout()
//   }, [logout])

//   const startFlow = async () => {
//     try {
//       const resp = await flow.start('https://auth.descope.io/login/P2jAQE43qtYLGjgYtStfEnuojdmU', '')
//       await manageSession(resp.data)
//     } catch (e) {
//       // handle errors
//     }
//   }
  
//   const exampleFetch = async () => {
//     if(session == undefined){
//         return;
//     }
//     const res = await fetch('http://localhost:3000/auth', {
//       headers: {
//         Authorization: `Bearer ${session.sessionJwt}`,
//       },
//     })
//   }

  return (
    <></>
    // <>
    //  {session ? (
    //     <View style={styles.container}>
    //       <Text>Welcome! {session.user.name}</Text>
    //       <Button onPress={handleLogout} title="Logout" />
    //     </View>
    //  ) : (
    //     <View style={styles.container}>
    //       <Text>Welcome!</Text>
    //       <Button onPress={startFlow} title="Start Flow" />
    //     </View>
    //  )}
    // </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});