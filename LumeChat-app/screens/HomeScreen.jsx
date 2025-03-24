import { View, Text } from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux'

const HomeScreen = () => {
  const user = useSelector((state) => state.user)
console.log("Logged User : ", user);
  return (
    <View>
      <Text>Home Screen</Text>
    </View>
  )
}

export default HomeScreen