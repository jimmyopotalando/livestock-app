// AlertScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, Alert, Linking } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';

const AlertScreen = ({ route, navigation }) => {
  const { image, reason } = route.params || {};

  const handleCallAuthorities = () => {
    Linking.openURL(`tel:999`); // Replace with actual authority number
  };

  const handleNotifyOwner = () => {
    Alert.alert('Owner Notified', 'A message has been sent to the registered channels.'); // Placeholder
  };

  return (
    <View style={styles.container}>
      <Header title="Unregistered Animal Alert" showBack={false} />

      <View style={styles.content}>
        <Text style={styles.alertText}>❌ No Match Found</Text>
        <Text style={styles.reasonText}>{reason || 'Animal may be unregistered.'}</Text>

        {image?.uri && (
          <Image
            source={{ uri: image.uri }}
            style={styles.animalImage}
            resizeMode="cover"
          />
        )}

        <Button title="Call Authorities" onPress={handleCallAuthorities} />

        <Button
          title="Notify Owner"
          onPress={handleNotifyOwner}
          style={{ backgroundColor: COLORS.secondary, marginTop: 12 }}
        />

        <Button
          title="Try Again"
          onPress={() => navigation.navigate('Verify')}
          style={{ backgroundColor: COLORS.gray, marginTop: 12 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  alertText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.danger || 'red',
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  animalImage: {
    width: 280,
    height: 200,
    borderRadius: 10,
    marginBottom: 24,
  },
});

export default AlertScreen;
