import React, { useState, useEffect, useRef }from 'react';

import { openModal, closeAllModals } from '@mantine/modals';
import {Group, Button, TextInput} from '@mantine/core';
export default function Board() {
    return (
        <Group position="center">
          <Button
            onClick={() => {
              openModal({
                title: 'Subscribe to newsletter',
                children: (
                  <>
                    <TextInput label="Your email" placeholder="Your email" data-autofocus />
                    <Button fullWidth onClick={closeAllModals} mt="md">
                      Submit
                    </Button>
                  </>
                ),
              });
            }}
          >
            Open content modal
          </Button>
        </Group>
    )
}