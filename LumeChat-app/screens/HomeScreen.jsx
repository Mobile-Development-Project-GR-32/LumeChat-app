import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'

const HomeScreen = () => {
  const user = useSelector((state) => state.user)

  const navigation = useNavigation()
console.log("Logged User : ", user);
  return (
    <View>
      <Text>Home Screen</Text>
      <TouchableOpacity onPress={() => navigation.navigate("ChatScreen")}>
        <Text className="text-discord-link text-sm">
            Test chat
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default HomeScreen