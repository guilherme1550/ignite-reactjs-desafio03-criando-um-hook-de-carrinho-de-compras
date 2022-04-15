import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // localStorage.clear();
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);
      const productStock: Stock = response.data

      const index = cart.findIndex((product) => product.id === productId)

      // Verifica se o produto já está no cart
      if (index >= 0) {
        
        if (cart[index].amount >= productStock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          cart[index].amount ++
          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        }

      } else {
        const response = await api.get(`/products/${productId}`)
        const newProduct = response.data;
        newProduct.amount = 1;
       
        if (newProduct.amount > productStock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          cart.push(newProduct);
          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find((product) => product.id === productId);
      
      if (!product) throw new Error();

      cart.splice(cart.indexOf(product), 1);
      setCart([...cart]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0)
        return

    const response = await api.get(`/stock/${productId}`)
    const productStock: Stock = response.data
    
    if (amount > productStock.amount) {
      toast.error('Quantidade solicitada fora de estoque');
      setCart([...cart]);
    } else {
      const index = cart.findIndex((product) => product.id === productId);
      if (index >= 0) {
        cart[index].amount = amount
        setCart([...cart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }
    }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
