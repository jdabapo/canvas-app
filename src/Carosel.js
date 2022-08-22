import { Carousel } from '@mantine/carousel';
import { Card } from '@mantine/core';

export default function Carosel() {
    return (
        <Carousel slideSize="70%" height={200} slideGap="md">
          
      <Carousel.Slide>
        <Card>1</Card></Carousel.Slide>
      <Carousel.Slide>2</Carousel.Slide>
      <Carousel.Slide>3</Carousel.Slide>
        </Carousel>
      );
}