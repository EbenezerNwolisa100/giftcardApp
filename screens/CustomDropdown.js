"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"

export default function CustomDropdown({ options, value, onSelect, placeholder = "Select", style }) {
  const { theme } = useTheme()
  const [visible, setVisible] = useState(false)
  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder

  const styles = StyleSheet.create({
    container: { width: "100%" },
    dropdown: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: theme.border,
    },
    selectedText: {
      fontSize: 16,
      color: value ? theme.text : theme.textMuted,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingVertical: 8,
      minWidth: 250,
      maxHeight: 350,
      elevation: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    option: {
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    optionText: {
      fontSize: 16,
      color: theme.text,
    },
  })

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.dropdown} onPress={() => setVisible(true)} activeOpacity={0.8}>
        <Text style={styles.selectedText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value)
                    setVisible(false)
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
