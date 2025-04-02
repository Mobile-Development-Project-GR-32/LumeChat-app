import { Text } from "react-native";

const Message = ({message}:{message:string}) => {
    return (
        <Text>
            {message}
        </Text>
    )
}

export { Message }