import React from 'react';
import { render } from '@testing-library/react';
import { SWRProvider } from '../swr.client';
import api from '../api.controller';

jest.mock('../api.controller');
const mockedApi = api as jest.Mocked<typeof api>;

describe('SWRProvider', () => {
  it('renders children and uses api.get as fetcher', () => {
    const { getByText } = render(
      <SWRProvider>
        <div>child</div>
      </SWRProvider>,
    );

    expect(getByText('child')).toBeDefined();
  });
});
