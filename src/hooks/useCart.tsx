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
    const storagedCart = localStorage.getItem('@RocketShoes:cart') //Buscar dados do localStorage 

    if (storagedCart) { 
      return JSON.parse(storagedCart); 
    }

    return [];
  });

  const addProduct = async (productId: number) => { // productID é o valor recebido
    try {

        //--------Verifica se o produto já esta no cart----------
      const updatedCart = [...cart]; // nova variavel com o spred do cart + o add
      const productExists = updatedCart.find(product => product.id === productId); // verifica se há um item de mesmo id
      
       //--------Verifica a quantidade em estoque----------

      const stock = await api.get(`/stock/${productId}`); //definido a rota da api e pelo get qual informação que será o parametro da busca buscada

      const stockAmount = stock.data.amount; // após o get, derá retirado do objeto o valor de amount
      const currentAmount = productExists ? productExists.amount : 0 //Neste ternário verifica se o produto já consta no carrinho e retira o amount
      const amount = currentAmount + 1 //Com a quantidade do amount do ternario anterior somamos +1 unidade

      if (amount > stockAmount) { //lógica para verificar o estoque se há ou não quantidade
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      //--------Adiciona 1 caso já haja no carrinho ou adiciona o produto no carrinho da api----------

      if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`); 

        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProduct);
      
      }
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productRemove = updatedCart.filter(product => product.id !== productId)
      
      setCart(productRemove);
      localStorage.setItem('@RocketShoes:', JSON.stringify(productRemove))


    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if  (amount <= 0) {  //verifica se a quantidade de estoque 
        return;
      }
      // ------Verificar se existe estopque------
      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      // ------Verificar se há do produto no cart------
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);
      // ------Altera o valor de amount do produto no cart------
      if (productExists) {
        productExists.amount = amount;
      
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

      } else {
        throw Error()
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
