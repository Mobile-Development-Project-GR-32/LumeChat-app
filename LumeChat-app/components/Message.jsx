import { Text, View } from "react-native";

const Message = ({message}) => {
    return (
        <View>
            <Text>
                {message}
            </Text>
        </View>
    )
}

export { Message }