
import React from 'react'
import {
    Card,
    Image,
    Group,
    Text,
    Badge,
    Button
} from '@mantine/core';

function DisplayItem({d, text, tmp, currentCoords={x:-1,y:-1}}){
    // change image to the biggest image size
    if(!tmp.description){
        tmp.description = "the author did not write anything for this art..."
    }
    else if(!d || d.toLocaleString() === 'Invalid Date'){
        d = "no time yet...";
    }
    return(
            <Card shadow="sm" radius="md" withBorder>
                <Card.Section>
                    <Image
                        src={tmp.imagePNG}
                        height={350}
                        width={350}
                        alt={tmp.artName}
                    />
                </Card.Section>
                <Group position="apart" mt="md" mb="xs">
                    <Text weight={500}>
                        {text}
                    </Text>
                    <Badge color="pink" variant="light">
                        {d ? d.toLocaleString(): "no time yet"}
                    </Badge>
                </Group>
                <Text size="sm" color="dimmed">
                    {tmp.description}
                </Text>
                {currentCoords.x !== -1 ?
                <Button variant="light" color="blue" fullWidth mt="md" radius="md">
                    item located at x:{currentCoords.x} y:{currentCoords.y}
                </Button>
                :
                <Button variant="light" color="blue" fullWidth mt="md" radius="md" disabled>
                    select a red box to show an image!
                </Button>
                }
            </Card>
    );
}

export default DisplayItem;