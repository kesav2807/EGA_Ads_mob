import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LocationPickerModal = (props) => {
    return (
        <View style={styles.container}>
            <Text>Map not supported on Web</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default LocationPickerModal;
