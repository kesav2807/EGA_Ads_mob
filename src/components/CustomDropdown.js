import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronDown, Check } from 'lucide-react-native';

const CustomDropdown = ({
    data = [],
    value,
    onChange,
    placeholder = "Select Item",
    editable = false,
    searchPlaceholder = "Search or type..."
}) => {
    const [isVisible, setIsVisible] = useState(false);

    const selectedItem = data.find(item => item.value === value);

    // When editable, we might want to show the raw value even if not in 'data'
    const displayValue = selectedItem ? selectedItem.label : (editable ? value : "");

    return (
        <View style={[styles.container, { zIndex: isVisible ? 1000 : 1 }]}>
            <View style={[styles.trigger, isVisible && styles.triggerActive]}>
                <View style={{ flex: 1 }}>
                    {editable ? (
                        <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={onChange}
                            placeholder={placeholder}
                            placeholderTextColor="#94a3b8"
                            onFocus={() => setIsVisible(true)}
                        />
                    ) : (
                        <TouchableOpacity
                            style={{ flex: 1, justifyContent: 'center' }}
                            onPress={() => setIsVisible(!isVisible)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.valueText, !selectedItem && styles.placeholderText]} numberOfLines={1}>
                                {selectedItem ? selectedItem.label : placeholder}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={{ padding: 4 }}>
                    <ChevronDown size={20} color={isVisible ? "#0ea5e9" : "#94a3b8"} />
                </TouchableOpacity>
            </View>

            {isVisible && (
                <Animated.View entering={FadeInDown.springify().mass(0.5)} style={styles.menu}>
                    <ScrollView
                        style={styles.menuScroll}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                    >
                        {data.map((item, index) => (
                            <TouchableOpacity
                                key={item.value || index}
                                style={[
                                    styles.item,
                                    value === item.value && styles.itemActive,
                                    index === data.length - 1 && { borderBottomWidth: 0 }
                                ]}
                                onPress={() => {
                                    onChange(item.value);
                                    setIsVisible(false);
                                }}
                            >
                                <Text style={[styles.itemText, value === item.value && styles.itemTextActive]}>
                                    {item.label}
                                </Text>
                                {value === item.value && <Check size={16} color="#0ea5e9" />}
                            </TouchableOpacity>
                        ))}
                        {data.length === 0 && !editable && (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No items available</Text>
                            </View>
                        )}
                        {editable && (
                            <TouchableOpacity
                                style={[styles.item, { backgroundColor: '#f0f9ff' }]}
                                onPress={() => setIsVisible(false)}
                            >
                                <Text style={[styles.itemText, { color: '#0ea5e9', fontSize: 12 }]}>
                                    Close list and use manual entry
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: 8,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        height: 54,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    input: {
        fontSize: 15,
        fontWeight: '500',
        color: '#0f172a',
        height: '100%',
        padding: 0,
    },
    triggerActive: {
        borderColor: '#0ea5e9',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        backgroundColor: '#f8fafc',
    },
    valueText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#0f172a',
    },
    placeholderText: {
        color: '#94a3b8',
    },
    menu: {
        position: 'absolute',
        top: 53, // slightly overlap border
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#0ea5e9',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        overflow: 'hidden',
        maxHeight: 250,
    },
    menuScroll: {
        maxHeight: 250,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#fff'
    },
    itemActive: {
        backgroundColor: '#f8fafc',
    },
    itemText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
    itemTextActive: {
        color: '#0ea5e9',
        fontWeight: '700',
    },
    emptyContainer: {
        padding: 16,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
    }
});

export default CustomDropdown;
